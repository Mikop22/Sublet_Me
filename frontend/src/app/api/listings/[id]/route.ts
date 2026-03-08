import { connectDB } from "@/lib/mongodb";
import { Listing } from "@/models/Listing";
import { User } from "@/models/User";

void User;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await connectDB();

    const doc = await Listing.findById(id).populate("hostId");
    if (!doc) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const startDate = new Date(doc.dates?.start);
    const endDate = new Date(doc.dates?.end);

    const result = {
      id: doc._id.toString(),
      title: doc.title,
      address: doc.address,
      city: doc.city,
      price: doc.price,
      dates: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      sqft: doc.sqft,
      beds: doc.beds,
      baths: doc.baths,
      type: doc.type,
      images: doc.images?.length ? doc.images : ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1400&h=900&fit=crop&q=80"],
      description: doc.description,
      amenities: doc.amenities,
      rules: doc.rules,
      neighborhood: doc.neighborhood,
      videoTour: doc.videoPublicId || doc.highlightUrl || "",
      videoPublicId: doc.videoPublicId || "",
      videoProcessing: Boolean(doc.videoProcessing),
      enrichmentStatus: doc.enrichment?.status ?? "pending",
      match: 75,
      host: {
        name: doc.hostId?.name || "Unknown",
        uni: doc.hostId?.university || "",
        avatar: doc.hostId?.avatar || null,
        bio: doc.hostId?.bio || "",
        responseTime: doc.hostId?.responseTime || "",
        tags: doc.hostId?.lifestyleTags || [],
      },
      sharedTags: doc.hostId?.lifestyleTags || [],
      matchReasons: [],
    };
    return Response.json(result);
  } catch (error) {
    console.error("Error fetching listing:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
