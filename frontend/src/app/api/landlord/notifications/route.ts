import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { requireCurrentHost, CurrentHostAuthError } from "@/lib/current-host";
import { buildLandlordNotifications } from "@/lib/landlord-notifications";
import { connectDB } from "@/lib/mongodb";
import { Conversation } from "@/models/Conversation";
import { Listing } from "@/models/Listing";
import { Match } from "@/models/Match";
import { Tour } from "@/models/Tour";

export async function GET() {
  try {
    const host = await requireCurrentHost();
    await connectDB();

    const hostId = new mongoose.Types.ObjectId(host._id);

    const listingDocs = await Listing.find({ hostId })
      .select("_id title")
      .lean<{ _id: { toString(): string }; title: string }[]>()
      .exec();

    const listingIds = listingDocs.map((l) => l._id);

    const [matches, conversations, tours] = await Promise.all([
      Match.find({ listingId: { $in: listingIds } })
        .select("_id listingId tenantId score status createdAt")
        .lean<
          {
            _id: { toString(): string };
            listingId: { toString(): string };
            tenantId: { toString(): string };
            score: number;
            status: string;
            createdAt?: Date;
          }[]
        >()
        .exec(),
      Conversation.find({ hostId })
        .select("_id listingId tenantId unreadByHost messages lastMessageAt")
        .lean<
          {
            _id: { toString(): string };
            listingId: { toString(): string };
            tenantId: { toString(): string };
            unreadByHost: number;
            messages: { senderId: string; text: string; type: string }[];
            lastMessageAt?: Date;
          }[]
        >()
        .exec(),
      Tour.find({ hostId, status: { $in: ["proposed", "confirmed"] } })
        .select("_id listingId tenantId status createdAt")
        .lean<
          {
            _id: { toString(): string };
            listingId: { toString(): string };
            tenantId: { toString(): string };
            status: string;
            createdAt?: Date;
          }[]
        >()
        .exec(),
    ]);

    const result = buildLandlordNotifications({
      listings: listingDocs.map((l) => ({
        _id: l._id.toString(),
        title: l.title,
      })),
      matches: matches.map((m) => ({
        _id: m._id.toString(),
        listingId: m.listingId.toString(),
        tenantId: m.tenantId.toString(),
        score: m.score,
        status: m.status,
        createdAt: m.createdAt?.toISOString(),
      })),
      conversations: conversations.map((c) => ({
        _id: c._id.toString(),
        listingId: c.listingId.toString(),
        tenantId: c.tenantId.toString(),
        unreadByHost: c.unreadByHost,
        messages: c.messages,
        lastMessageAt: c.lastMessageAt?.toISOString(),
      })),
      tours: tours.map((t) => ({
        _id: t._id.toString(),
        listingId: t.listingId.toString(),
        tenantId: t.tenantId.toString(),
        status: t.status,
        createdAt: t.createdAt?.toISOString(),
      })),
    });

    return NextResponse.json(result);
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
