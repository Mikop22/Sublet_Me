import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { requireCurrentHost, CurrentHostAuthError } from "@/lib/current-host";
import { buildLandlordDashboardPayload, toLandlordListingSummary } from "@/lib/landlord-listings";
import { connectDB } from "@/lib/mongodb";
import { Conversation } from "@/models/Conversation";
import { Listing } from "@/models/Listing";
import { Match } from "@/models/Match";
import { Tour } from "@/models/Tour";

type ListingAggregateRecord = {
  _id: { toString(): string };
  title: string;
  address: string;
  price: number;
  dates: {
    start: Date | string;
    end: Date | string;
  };
  status: "active" | "paused" | "filled";
  images?: string[];
  highlightUrl?: string;
  videoProcessing?: boolean;
  stats?: {
    views?: number;
    inquiries?: number;
  };
};

export async function GET() {
  try {
    const host = await requireCurrentHost();
    await connectDB();

    const hostId = new mongoose.Types.ObjectId(host._id);

    const [listings, matchCounts, unreadMessagesResult, upcomingTours] =
      await Promise.all([
        Listing.find({ hostId })
          .sort({ createdAt: -1 })
          .select(
            "_id title address price dates status images highlightUrl videoProcessing stats"
          )
          .lean<ListingAggregateRecord[]>()
          .exec(),
        Match.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
          { $lookup: {
              from: "listings",
              localField: "listingId",
              foreignField: "_id",
              as: "listing",
            } },
          { $unwind: "$listing" },
          { $match: { "listing.hostId": hostId } },
          { $group: { _id: "$listingId", count: { $sum: 1 } } },
        ]).exec(),
        Conversation.aggregate<{ _id: null; total: number }>([
          { $match: { hostId } },
          { $group: { _id: null, total: { $sum: "$unreadByHost" } } },
        ]).exec(),
        Tour.countDocuments({
          hostId,
          status: { $in: ["proposed", "confirmed"] },
        }).exec(),
      ]);

    const matchCountByListingId = new Map(
      matchCounts.map((record) => [record._id.toString(), record.count])
    );

    const payload = buildLandlordDashboardPayload({
      listings: listings.map((listing) =>
        toLandlordListingSummary(
          listing,
          matchCountByListingId.get(listing._id.toString()) ?? 0
        )
      ),
      unreadMessages: unreadMessagesResult[0]?.total ?? 0,
      upcomingTours,
    });

    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof CurrentHostAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
