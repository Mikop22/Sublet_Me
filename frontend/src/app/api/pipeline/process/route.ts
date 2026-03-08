import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Listing } from "@/models/Listing";
import { runVideoPipeline } from "@/lib/pipeline";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const video = formData.get("video");
    if (!video || !(video instanceof File)) {
      return Response.json({ error: "Missing video field" }, { status: 400 });
    }

    const title = formData.get("title") as string;
    const address = formData.get("address") as string;
    const city = (formData.get("city") as string) ?? "Toronto";
    const price = Number(formData.get("price"));
    const datesStart = formData.get("datesStart") as string;
    const datesEnd = formData.get("datesEnd") as string;
    const status = (formData.get("status") as string) ?? "active";
    const budgetMin = Number(formData.get("budgetMin"));
    const budgetMax = Number(formData.get("budgetMax"));
    const termPreference = formData.get("termPreference") as string;
    const petPolicy = (formData.get("petPolicy") as string) ?? "no-pets";
    const genderPreference =
      (formData.get("genderPreference") as string) ?? "no-preference";
    const occupants = Number(formData.get("occupants") ?? 1);
    const referencesRequired =
      (formData.get("referencesRequired") as string) === "true";
    const lifestyleTagsRaw = formData.get("lifestyleTags") as string | null;
    const lifestyleTags: string[] = lifestyleTagsRaw
      ? JSON.parse(lifestyleTagsRaw)
      : [];

    await connectDB();

    const listing = await Listing.create({
      hostId: new mongoose.Types.ObjectId("000000000000000000000001"),
      title,
      address,
      city,
      price,
      dates: {
        start: new Date(datesStart),
        end: new Date(datesEnd),
      },
      status,
      images: [],
      videoProcessing: true,
      requirements: {
        budgetMin,
        budgetMax,
        termPreference,
        petPolicy,
        genderPreference,
        occupants,
        referencesRequired,
        lifestyleTags,
      },
    });

    const listingId = listing._id.toString();

    const videoBuffer = Buffer.from(await video.arrayBuffer());

    runVideoPipeline(videoBuffer, listingId).catch((err) =>
      console.error("[pipeline] unhandled:", err)
    );

    return Response.json({ listingId });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
