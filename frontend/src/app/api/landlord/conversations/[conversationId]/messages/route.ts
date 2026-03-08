import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { requireCurrentHost, CurrentHostAuthError } from "@/lib/current-host";
import {
  toLandlordConversationMessages,
  type LandlordConversationRecord,
  type LandlordTenantRecord,
} from "@/lib/landlord-detail";
import { connectDB } from "@/lib/mongodb";
import { Conversation } from "@/models/Conversation";
import { Match } from "@/models/Match";
import { User } from "@/models/User";

type ObjectIdLike = string | { toString(): string };

function toId(value: ObjectIdLike): string {
  return typeof value === "string" ? value : value.toString();
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const [{ conversationId }, host] = await Promise.all([
      params,
      requireCurrentHost(),
    ]);

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const body = (await request.json()) as { text?: unknown };
    const text =
      typeof body.text === "string"
        ? body.text.trim()
        : "";

    if (!text) {
      return NextResponse.json({ error: "Message text is required" }, { status: 400 });
    }

    await connectDB();

    const hostId = new mongoose.Types.ObjectId(host._id);
    const conversationObjectId = new mongoose.Types.ObjectId(conversationId);

    const conversation = await Conversation.findOne({
      _id: conversationObjectId,
      hostId,
    })
      .select("_id listingId tenantId")
      .lean<{
        _id: { toString(): string };
        listingId: ObjectIdLike;
        tenantId: ObjectIdLike;
      } | null>()
      .exec();

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const now = new Date();

    await Promise.all([
      Conversation.updateOne(
        { _id: conversationObjectId, hostId },
        {
          $push: {
            messages: {
              senderId: hostId,
              text,
              type: "text",
              createdAt: now,
              updatedAt: now,
            },
          },
          $set: {
            lastMessageAt: now,
            unreadByHost: 0,
          },
          $inc: {
            unreadByTenant: 1,
          },
        }
      ).exec(),
      Match.updateOne(
        {
          listingId: conversation.listingId,
          tenantId: conversation.tenantId,
        },
        {
          $set: {
            status: "contacted",
          },
        }
      ).exec(),
    ]);

    const [updatedConversation, tenant] = await Promise.all([
      Conversation.findById(conversationObjectId)
        .select("_id tenantId unreadByHost messages")
        .lean<LandlordConversationRecord | null>()
        .exec(),
      User.findById(conversation.tenantId)
        .select("_id name")
        .lean<LandlordTenantRecord | null>()
        .exec(),
    ]);

    if (!updatedConversation || !tenant) {
      return NextResponse.json(
        { error: "Conversation update could not be loaded" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      messages: toLandlordConversationMessages({
        conversation: updatedConversation,
        hostId: host._id,
        hostName: host.name,
        tenant,
      }),
      conversationId: toId(updatedConversation._id),
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
