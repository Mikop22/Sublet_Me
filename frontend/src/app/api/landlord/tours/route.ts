import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { requireCurrentHost, CurrentHostAuthError } from "@/lib/current-host";
import {
  toLandlordConversationMessages,
  toLandlordTour,
  type LandlordConversationRecord,
  type LandlordTenantRecord,
  type LandlordTourRecord,
} from "@/lib/landlord-detail";
import { connectDB } from "@/lib/mongodb";
import { Conversation } from "@/models/Conversation";
import { Match } from "@/models/Match";
import { Tour } from "@/models/Tour";
import { User } from "@/models/User";

type ObjectIdLike = string | { toString(): string };

type TourConversationRecord = {
  _id: { toString(): string };
  listingId: ObjectIdLike;
  tenantId: ObjectIdLike;
};

class TourRequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "TourRequestError";
    this.status = status;
  }
}

function parseSlot(rawSlot: string): Date | null {
  const slot = new Date(rawSlot);
  if (Number.isNaN(slot.getTime())) {
    return null;
  }

  return slot;
}

function buildMeetLink(conversationId: string): string {
  const cleanId = conversationId.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  const segment = cleanId.padEnd(9, "x").slice(0, 9);

  return `https://meet.google.com/${segment.slice(0, 3)}-${segment.slice(3, 6)}-${segment.slice(6, 9)}`;
}

export async function POST(request: Request) {
  try {
    const host = await requireCurrentHost();
    const body = (await request.json()) as {
      action?: unknown;
      conversationId?: unknown;
      slots?: unknown;
      selectedSlot?: unknown;
    };

    const action = body.action;
    const conversationId =
      typeof body.conversationId === "string"
        ? body.conversationId
        : "";

    if (
      (action !== "propose" && action !== "confirm") ||
      !mongoose.Types.ObjectId.isValid(conversationId)
    ) {
      return NextResponse.json({ error: "Invalid tour request" }, { status: 400 });
    }

    await connectDB();

    const hostId = new mongoose.Types.ObjectId(host._id);
    const conversationObjectId = new mongoose.Types.ObjectId(conversationId);

    const conversation = await Conversation.findOne({
      _id: conversationObjectId,
      hostId,
    })
      .select("_id listingId tenantId")
      .lean<TourConversationRecord | null>()
      .exec();

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const result =
      action === "propose"
        ? await proposeTour({
            slots: body.slots,
            conversation,
            conversationObjectId,
            hostId,
          })
        : await confirmTour({
            selectedSlot: body.selectedSlot,
            conversation,
            conversationObjectId,
            hostId,
          });

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
        { error: "Tour update could not be loaded" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      tour: toLandlordTour(result),
      messages: toLandlordConversationMessages({
        conversation: updatedConversation,
        hostId: host._id,
        hostName: host.name,
        tenant,
      }),
      conversationId: updatedConversation._id.toString(),
    });
  } catch (error) {
    if (error instanceof CurrentHostAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof TourRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

async function proposeTour({
  slots,
  conversation,
  conversationObjectId,
  hostId,
}: {
  slots: unknown;
  conversation: TourConversationRecord;
  conversationObjectId: mongoose.Types.ObjectId;
  hostId: mongoose.Types.ObjectId;
}): Promise<LandlordTourRecord> {
  if (!Array.isArray(slots) || slots.length === 0 || slots.length > 3) {
    throw new TourRequestError(400, "At least one and at most three tour slots are required");
  }

  const parsedSlots = slots
    .filter((slot): slot is string => typeof slot === "string")
    .map(parseSlot);

  if (parsedSlots.length !== slots.length || parsedSlots.some((slot) => !slot)) {
    throw new TourRequestError(400, "Tour slots must be valid ISO timestamps");
  }

  const proposedSlots = parsedSlots.filter((slot): slot is Date => slot instanceof Date);
  const now = new Date();

  await Promise.all([
    Tour.findOneAndUpdate(
      { conversationId: conversationObjectId, hostId },
      {
        $set: {
          listingId: conversation.listingId,
          tenantId: conversation.tenantId,
          proposedSlots,
          selectedSlot: null,
          meetLink: "",
          status: "proposed",
        },
        $setOnInsert: {
          conversationId: conversationObjectId,
          hostId,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    ).exec(),
    Conversation.updateOne(
      { _id: conversationObjectId, hostId },
      {
        $push: {
          messages: {
            senderId: hostId,
            text: "I am available at these times. Pick the one that works best for you.",
            type: "tour-proposal",
            tourSlots: proposedSlots,
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

  const updatedTour = await Tour.findOne({
    conversationId: conversationObjectId,
    hostId,
  })
    .select("_id status proposedSlots selectedSlot meetLink")
    .lean<LandlordTourRecord | null>()
    .exec();

  if (!updatedTour) {
    throw new TourRequestError(500, "Tour proposal could not be loaded");
  }

  return updatedTour;
}

async function confirmTour({
  selectedSlot,
  conversation,
  conversationObjectId,
  hostId,
}: {
  selectedSlot: unknown;
  conversation: TourConversationRecord;
  conversationObjectId: mongoose.Types.ObjectId;
  hostId: mongoose.Types.ObjectId;
}): Promise<LandlordTourRecord> {
  if (typeof selectedSlot !== "string") {
    throw new TourRequestError(400, "A selected tour slot is required");
  }

  const parsedSlot = parseSlot(selectedSlot);
  if (!parsedSlot) {
    throw new TourRequestError(400, "Selected tour slot must be a valid ISO timestamp");
  }

  const existingTour = await Tour.findOne({
    conversationId: conversationObjectId,
    hostId,
  })
    .select("_id status proposedSlots selectedSlot meetLink")
    .lean<LandlordTourRecord | null>()
    .exec();

  if (!existingTour) {
    throw new TourRequestError(404, "Tour proposal not found");
  }

  const meetLink =
    existingTour.meetLink || buildMeetLink(conversation._id.toString());
  const now = new Date();

  await Promise.all([
    Tour.updateOne(
      { _id: existingTour._id, hostId },
      {
        $set: {
          selectedSlot: parsedSlot,
          status: "confirmed",
          meetLink,
        },
      }
    ).exec(),
    Conversation.updateOne(
      { _id: conversationObjectId, hostId },
      {
        $push: {
          messages: {
            senderId: hostId,
            text: "Tour confirmed. I just shared the meeting link.",
            type: "tour-confirmed",
            selectedSlot: parsedSlot,
            meetLink,
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

  const updatedTour = await Tour.findById(existingTour._id)
    .select("_id status proposedSlots selectedSlot meetLink")
    .lean<LandlordTourRecord | null>()
    .exec();

  if (!updatedTour) {
    throw new TourRequestError(500, "Confirmed tour could not be loaded");
  }

  return updatedTour;
}
