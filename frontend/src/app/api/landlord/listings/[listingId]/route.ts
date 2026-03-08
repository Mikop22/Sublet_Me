import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { requireCurrentHost, CurrentHostAuthError } from "@/lib/current-host";
import {
  toLandlordListingDetail,
  type LandlordListingDetailRecord,
} from "@/lib/landlord-detail";
import { connectDB } from "@/lib/mongodb";
import { Listing } from "@/models/Listing";
import { Match } from "@/models/Match";
import { Conversation } from "@/models/Conversation";
import { Tour } from "@/models/Tour";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const [{ listingId }, host] = await Promise.all([
      params,
      requireCurrentHost(),
    ]);

    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    await connectDB();

    const hostId = new mongoose.Types.ObjectId(host._id);
    const listingObjectId = new mongoose.Types.ObjectId(listingId);

    const [listing, matchCount] = await Promise.all([
      Listing.findOne({ _id: listingObjectId, hostId })
        .select(
          "_id title address price dates status images highlightUrl videoProcessing requirements stats enrichment"
        )
        .lean<LandlordListingDetailRecord | null>()
        .exec(),
      Match.countDocuments({ listingId: listingObjectId }).exec(),
    ]);

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json({
      listing: toLandlordListingDetail(listing, matchCount),
    });
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const [{ listingId }, host] = await Promise.all([
      params,
      requireCurrentHost(),
    ]);

    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    await connectDB();

    const hostId = new mongoose.Types.ObjectId(host._id);
    const listingObjectId = new mongoose.Types.ObjectId(listingId);

    const listing = await Listing.findOne({ _id: listingObjectId, hostId });
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    await Promise.all([
      Listing.deleteOne({ _id: listingObjectId }),
      Match.deleteMany({ listingId: listingObjectId }),
      Conversation.deleteMany({ listingId: listingObjectId }),
      Tour.deleteMany({ listingId: listingObjectId }),
    ]);

    return NextResponse.json({ deleted: true });
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
