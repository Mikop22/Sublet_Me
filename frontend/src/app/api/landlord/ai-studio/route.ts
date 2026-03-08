import { NextResponse } from "next/server";
import { requireCurrentHost, CurrentHostAuthError } from "@/lib/current-host";
import { connectDB } from "@/lib/mongodb";
import { Listing } from "@/models/Listing";
import { buildStudioAssetOptions } from "@/lib/ai-studio";

export async function GET() {
  try {
    const host = await requireCurrentHost();
    await connectDB();

    const listings = await Listing.find({
      hostId: host._id,
      $or: [
        { images: { $exists: true, $ne: [] } },
        { videoPublicId: { $exists: true, $ne: "" } },
      ],
    })
      .select("_id title images highlightUrl videoPublicId")
      .lean()
      .exec();

    const assets = buildStudioAssetOptions(
      listings.map((l) => ({
        _id: String(l._id),
        title: l.title,
        images: l.images ?? [],
        highlightUrl: l.highlightUrl ?? "",
        videoPublicId: l.videoPublicId ?? "",
      }))
    );

    return NextResponse.json({ assets });
  } catch (error) {
    if (error instanceof CurrentHostAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("AI Studio route error:", error);
    return NextResponse.json({ error: "Failed to load studio assets" }, { status: 500 });
  }
}
