import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { requireCurrentHost, CurrentHostAuthError } from "@/lib/current-host";
import {
  toLandlordMatch,
  type LandlordConversationRecord,
  type LandlordMatchRecord,
  type LandlordTenantRecord,
  type LandlordTourRecord,
} from "@/lib/landlord-detail";
import { connectDB } from "@/lib/mongodb";
import { Conversation } from "@/models/Conversation";
import { Listing } from "@/models/Listing";
import { Match } from "@/models/Match";
import { Tour } from "@/models/Tour";
import { User } from "@/models/User";

type ObjectIdLike = string | { toString(): string };

type MatchQueryRecord = LandlordMatchRecord & {
  tenantId: ObjectIdLike;
};

type TourQueryRecord = LandlordTourRecord & {
  tenantId: ObjectIdLike;
};

function toId(value: ObjectIdLike): string {
  return typeof value === "string" ? value : value.toString();
}

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

    const listing = await Listing.findOne({ _id: listingObjectId, hostId })
      .select("_id")
      .lean<{ _id: { toString(): string } } | null>()
      .exec();

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const matches = await Match.find({ listingId: listingObjectId })
      .sort({ score: -1, createdAt: 1 })
      .select("_id tenantId score status reasons sharedTags")
      .lean<MatchQueryRecord[]>()
      .exec();

    const tenantIds = Array.from(new Set(matches.map((match) => toId(match.tenantId))));

    const [tenants, conversations, tours] = await Promise.all([
      User.find({ _id: { $in: tenantIds } })
        .select("_id name university avatar bio lifestyleTags preferences.term")
        .lean<LandlordTenantRecord[]>()
        .exec(),
      Conversation.find({ listingId: listingObjectId, hostId })
        .sort({ lastMessageAt: -1 })
        .select("_id tenantId unreadByHost messages")
        .lean<LandlordConversationRecord[]>()
        .exec(),
      Tour.find({ listingId: listingObjectId, hostId })
        .sort({ updatedAt: -1 })
        .select("_id tenantId status proposedSlots selectedSlot meetLink")
        .lean<TourQueryRecord[]>()
        .exec(),
    ]);

    const tenantById = new Map(tenants.map((tenant) => [toId(tenant._id), tenant]));
    const conversationByTenantId = new Map(
      conversations.map((conversation) => [toId(conversation.tenantId), conversation])
    );
    const tourByTenantId = new Map<string, TourQueryRecord>();

    for (const tour of tours) {
      const tenantId = toId(tour.tenantId);
      if (!tourByTenantId.has(tenantId)) {
        tourByTenantId.set(tenantId, tour);
      }
    }

    return NextResponse.json({
      matches: matches
        .map((match) => {
          const tenant = tenantById.get(toId(match.tenantId));

          if (!tenant) {
            return null;
          }

          return toLandlordMatch({
            match,
            tenant,
            conversation: conversationByTenantId.get(toId(match.tenantId)) ?? null,
            tour: tourByTenantId.get(toId(match.tenantId)) ?? null,
            hostId: host._id,
            hostName: host.name,
          });
        })
        .filter((match): match is NonNullable<typeof match> => match !== null),
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
