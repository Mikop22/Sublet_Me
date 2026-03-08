import type {
  LandlordConversationMessage,
  LandlordListingDetail,
  LandlordMatch,
  LandlordMatchReason,
  LandlordMatchStatus,
  LandlordRequirements,
  LandlordTour,
  LandlordTourStatus,
} from "@/lib/landlord-types";

const TORONTO_TIMEZONE = "America/Toronto";

type ObjectIdLike = string | { toString(): string };
type DateValue = Date | string;

type ConversationMessageRecord = {
  _id?: ObjectIdLike;
  senderId: ObjectIdLike;
  text: string;
  type?: "text" | "tour-proposal" | "tour-confirmed";
  tourSlots?: DateValue[];
  selectedSlot?: DateValue | null;
  meetLink?: string;
  createdAt?: DateValue;
};

export type LandlordConversationRecord = {
  _id: ObjectIdLike;
  tenantId: ObjectIdLike;
  unreadByHost?: number;
  messages?: ConversationMessageRecord[];
};

export type LandlordTourRecord = {
  _id: ObjectIdLike;
  status: LandlordTourStatus;
  proposedSlots?: DateValue[];
  selectedSlot?: DateValue | null;
  meetLink?: string;
};

export type LandlordTenantRecord = {
  _id: ObjectIdLike;
  name: string;
  university?: string;
  avatar?: string;
  bio?: string;
  lifestyleTags?: string[];
  preferences?: {
    term?: string;
  };
};

export type LandlordMatchRecord = {
  _id: ObjectIdLike;
  score: number;
  status: LandlordMatchStatus;
  reasons?: Array<{
    label: string;
    matched: boolean;
    detail?: string;
  }>;
  sharedTags?: string[];
};

export type LandlordListingDetailRecord = {
  _id: ObjectIdLike;
  title: string;
  address: string;
  price: number;
  dates: {
    start: DateValue;
    end: DateValue;
  };
  status: "active" | "paused" | "filled";
  images?: string[];
  highlightUrl?: string;
  videoProcessing?: boolean;
  enrichment?: {
    status?: string;
  };
  requirements: LandlordRequirements;
  stats?: {
    views?: number;
    inquiries?: number;
  };
};

function toId(value: ObjectIdLike): string {
  return typeof value === "string" ? value : value.toString();
}

function toDate(value: DateValue): Date {
  return value instanceof Date ? value : new Date(value);
}

function formatDate(value: DateValue): string {
  return toDate(value).toLocaleDateString("en-US", {
    timeZone: TORONTO_TIMEZONE,
  });
}

function formatTime(value: DateValue): string {
  return toDate(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: TORONTO_TIMEZONE,
  });
}

function toIsoString(value: DateValue): string {
  return toDate(value).toISOString();
}

export function formatTourSlot(value: DateValue): string {
  return `${toDate(value).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: TORONTO_TIMEZONE,
  })} at ${formatTime(value)}`;
}

export function toLandlordListingDetail(
  listing: LandlordListingDetailRecord,
  matchCount: number
): LandlordListingDetail {
  return {
    id: toId(listing._id),
    title: listing.title,
    address: listing.address,
    price: listing.price,
    dates: `${formatDate(listing.dates.start)} - ${formatDate(listing.dates.end)}`,
    image: listing.images?.[0] ?? null,
    galleryImages: listing.images ?? [],
    status: listing.status,
    matches: matchCount,
    views: listing.stats?.views ?? 0,
    inquiries: listing.stats?.inquiries ?? 0,
    videoProcessing: Boolean(listing.videoProcessing),
    highlightUrl: listing.highlightUrl ?? "",
    enrichmentStatus: listing.enrichment?.status ?? "pending",
    requirements: listing.requirements,
  };
}

export function toLandlordTour(tour: LandlordTourRecord | null): LandlordTour | null {
  if (!tour) {
    return null;
  }

  return {
    id: toId(tour._id),
    status: tour.status,
    proposedSlots: (tour.proposedSlots ?? []).map(toIsoString),
    selectedSlot: tour.selectedSlot ? toIsoString(tour.selectedSlot) : undefined,
    meetLink: tour.meetLink || undefined,
  };
}

export function toLandlordConversationMessages({
  conversation,
  hostId,
  hostName,
  tenant,
}: {
  conversation: LandlordConversationRecord | null;
  hostId: string;
  hostName: string;
  tenant: LandlordTenantRecord;
}): LandlordConversationMessage[] {
  if (!conversation?.messages?.length) {
    return [];
  }

  const tenantId = toId(tenant._id);

  return conversation.messages.map((message, index) => {
    const senderId = toId(message.senderId);
    const sender =
      senderId === hostId
        ? "host"
        : senderId === tenantId
          ? "tenant"
          : "tenant";

    return {
      id: message._id ? toId(message._id) : `${toId(conversation._id)}-${index}`,
      sender,
      senderName: sender === "host" ? hostName : tenant.name,
      text: message.text,
      timestamp: formatTime(message.createdAt ?? new Date()),
      type: message.type ?? "text",
      tourSlots: message.tourSlots?.map(toIsoString),
      selectedSlot: message.selectedSlot ? toIsoString(message.selectedSlot) : undefined,
      meetLink: message.meetLink || undefined,
    };
  });
}

export function toLandlordMatch({
  match,
  tenant,
  conversation,
  tour,
  hostId,
  hostName,
}: {
  match: LandlordMatchRecord;
  tenant: LandlordTenantRecord;
  conversation: LandlordConversationRecord | null;
  tour: LandlordTourRecord | null;
  hostId: string;
  hostName: string;
}): LandlordMatch {
  const reasons: LandlordMatchReason[] = (match.reasons ?? []).map((reason) => ({
    label: reason.label,
    matched: reason.matched,
    detail: reason.detail ?? "",
  }));

  return {
    id: toId(tenant._id),
    name: tenant.name,
    university: tenant.university ?? "",
    term: tenant.preferences?.term ?? "",
    avatar: tenant.avatar ?? "",
    match: match.score,
    lifestyleTags: tenant.lifestyleTags ?? [],
    bio: tenant.bio ?? "",
    sharedTags: match.sharedTags ?? [],
    reasons,
    status: match.status,
    conversationId: conversation ? toId(conversation._id) : null,
    unreadCount: conversation?.unreadByHost ?? 0,
    messages: toLandlordConversationMessages({
      conversation,
      hostId,
      hostName,
      tenant,
    }),
    tour: toLandlordTour(tour),
  };
}
