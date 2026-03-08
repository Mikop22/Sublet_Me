import { connectDB } from "@/lib/mongodb";
import { Listing } from "@/models/Listing";
import { User } from "@/models/User";

void User;

type ListingSummaryDocument = {
  _id: { toString(): string };
  title: string;
  address: string;
  price: number;
  dates?: {
    start?: Date | string;
    end?: Date | string;
  };
  images?: string[];
  hostId?: {
    name?: string;
    university?: string;
    avatar?: string | null;
    lifestyleTags?: string[];
  } | null;
  beds?: number;
  type?: string;
  description?: string;
  amenities?: string[];
  city?: string;
  videoProcessing?: boolean;
  highlightUrl?: string;
};

function thumbUrl(url: string): string {
  return url.replace(/w=\d+/, "w=600").replace(/h=\d+/, "h=400").replace(/q=\d+/, "q=70");
}

export async function GET() {
  try {
    await connectDB();

    const listings = await Listing.find()
      .populate("hostId")
      .lean<ListingSummaryDocument[]>()
      .exec();

    const transformed = listings.map((doc, idx) => {
      const startDate = doc.dates?.start ? new Date(doc.dates.start) : null;
      const endDate = doc.dates?.end ? new Date(doc.dates.end) : null;
      const dateStr =
        startDate && endDate
          ? `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
          : "";
      const isTopPick = idx >= listings.length - 4;

      return {
        id: doc._id.toString(),
        title: doc.title,
        address: doc.address,
        price: doc.price,
        dates: dateStr,
        image: thumbUrl(doc.images?.[0] || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1400&h=900&fit=crop&q=85"),
        host: {
          name: doc.hostId?.name || "Unknown",
          uni: doc.hostId?.university || "",
          avatar: doc.hostId?.avatar || null,
        },
        sharedTags: doc.hostId?.lifestyleTags || [],
        match: isTopPick ? 95 : 75,
        beds: doc.beds,
        type: doc.type,
        description: doc.description,
        amenities: doc.amenities,
        city: doc.city,
        videoProcessing: Boolean(doc.videoProcessing),
        highlightUrl: doc.highlightUrl || "",
      };
    });

    return Response.json(transformed);
  } catch (error) {
    console.error("Error in /api/listings:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
