import assert from "node:assert/strict";
import test from "node:test";

import {
  toLandlordConversationMessages,
  toLandlordListingDetail,
  toLandlordMatch,
  toLandlordTour,
  type LandlordConversationRecord,
  type LandlordListingDetailRecord,
  type LandlordMatchRecord,
  type LandlordTenantRecord,
  type LandlordTourRecord,
} from "./landlord-detail.ts";

function makeListing(
  overrides: Partial<LandlordListingDetailRecord> = {}
): LandlordListingDetailRecord {
  return {
    _id: "listing-1",
    title: "Sunny Studio",
    address: "45 Liberty St, Toronto",
    price: 950,
    dates: {
      start: "2026-05-01T00:00:00.000Z",
      end: "2026-08-31T00:00:00.000Z",
    },
    status: "active",
    images: ["https://example.com/cover.jpg", "https://example.com/gallery.jpg"],
    highlightUrl: "https://example.com/highlight.mp4",
    videoProcessing: false,
    requirements: {
      budgetMin: 900,
      budgetMax: 1100,
      lifestyleTags: ["Non-smoker", "Quiet & studious"],
      termPreference: "Summer 2026",
      petPolicy: "no-pets",
      genderPreference: "no-preference",
      occupants: 1,
      referencesRequired: true,
    },
    stats: {
      views: 42,
      inquiries: 5,
    },
    ...overrides,
  };
}

function makeTenant(
  overrides: Partial<LandlordTenantRecord> = {}
): LandlordTenantRecord {
  return {
    _id: "tenant-1",
    name: "Aisha Rahman",
    university: "University of Waterloo",
    avatar: "https://example.com/aisha.jpg",
    bio: "Quiet co-op student looking for a downtown place.",
    lifestyleTags: ["Non-smoker", "Quiet & studious", "Early bird"],
    preferences: {
      term: "Summer 2026",
    },
    ...overrides,
  };
}

function makeMatch(overrides: Partial<LandlordMatchRecord> = {}): LandlordMatchRecord {
  return {
    _id: "match-1",
    score: 96,
    status: "pending",
    sharedTags: ["Non-smoker", "Quiet & studious"],
    reasons: [
      {
        label: "Budget fit",
        matched: true,
        detail: "Comfortably within the requested range.",
      },
    ],
    ...overrides,
  };
}

function makeConversation(
  overrides: Partial<LandlordConversationRecord> = {}
): LandlordConversationRecord {
  return {
    _id: "conversation-1",
    tenantId: "tenant-1",
    unreadByHost: 1,
    messages: [
      {
        _id: "message-1",
        senderId: "tenant-1",
        text: "Hi, is the unit still available?",
        type: "text",
        createdAt: "2026-03-08T14:15:00.000Z",
      },
      {
        _id: "message-2",
        senderId: "host-1",
        text: "Yes, it is. I can show it this week.",
        type: "text",
        createdAt: "2026-03-08T15:05:00.000Z",
      },
      {
        _id: "message-3",
        senderId: "host-1",
        text: "Choose a time that works for you.",
        type: "tour-proposal",
        tourSlots: [
          "2026-03-10T15:00:00.000Z",
          "2026-03-10T17:30:00.000Z",
        ],
        createdAt: "2026-03-08T15:10:00.000Z",
      },
    ],
    ...overrides,
  };
}

function makeTour(overrides: Partial<LandlordTourRecord> = {}): LandlordTourRecord {
  return {
    _id: "tour-1",
    status: "confirmed",
    proposedSlots: [
      "2026-03-10T15:00:00.000Z",
      "2026-03-10T17:30:00.000Z",
    ],
    selectedSlot: "2026-03-10T17:30:00.000Z",
    meetLink: "https://meet.google.com/demo-tour-link",
    ...overrides,
  };
}

test("toLandlordListingDetail maps listing media, requirements, and counts", () => {
  const detail = toLandlordListingDetail(makeListing(), 3);

  assert.equal(detail.id, "listing-1");
  assert.equal(detail.matches, 3);
  assert.equal(detail.image, "https://example.com/cover.jpg");
  assert.deepEqual(detail.galleryImages, [
    "https://example.com/cover.jpg",
    "https://example.com/gallery.jpg",
  ]);
  assert.equal(detail.highlightUrl, "https://example.com/highlight.mp4");
  assert.deepEqual(detail.requirements.lifestyleTags, [
    "Non-smoker",
    "Quiet & studious",
  ]);
});

test("toLandlordConversationMessages formats sender labels and proposed tour slots", () => {
  const messages = toLandlordConversationMessages({
    conversation: makeConversation(),
    hostId: "host-1",
    hostName: "Jordan",
    tenant: makeTenant(),
  });

  assert.equal(messages.length, 3);
  assert.deepEqual(
    messages.map((message) => ({
      sender: message.sender,
      senderName: message.senderName,
      type: message.type,
    })),
    [
      { sender: "tenant", senderName: "Aisha Rahman", type: "text" },
      { sender: "host", senderName: "Jordan", type: "text" },
      { sender: "host", senderName: "Jordan", type: "tour-proposal" },
    ]
  );
  assert.deepEqual(messages[2].tourSlots, [
    "2026-03-10T15:00:00.000Z",
    "2026-03-10T17:30:00.000Z",
  ]);
});

test("toLandlordTour preserves selected slot and meet link", () => {
  const tour = toLandlordTour(makeTour());

  assert.deepEqual(tour, {
    id: "tour-1",
    status: "confirmed",
    proposedSlots: ["2026-03-10T15:00:00.000Z", "2026-03-10T17:30:00.000Z"],
    selectedSlot: "2026-03-10T17:30:00.000Z",
    meetLink: "https://meet.google.com/demo-tour-link",
  });
});

test("toLandlordMatch combines tenant, conversation, and tour data for the UI", () => {
  const match = toLandlordMatch({
    match: makeMatch(),
    tenant: makeTenant(),
    conversation: makeConversation(),
    tour: makeTour(),
    hostId: "host-1",
    hostName: "Jordan",
  });

  assert.equal(match.id, "tenant-1");
  assert.equal(match.name, "Aisha Rahman");
  assert.equal(match.match, 96);
  assert.deepEqual(match.sharedTags, ["Non-smoker", "Quiet & studious"]);
  assert.equal(match.unreadCount, 1);
  assert.equal(match.conversationId, "conversation-1");
  assert.equal(match.messages.length, 3);
  assert.equal(match.tour?.status, "confirmed");
  assert.equal(match.tour?.selectedSlot, "2026-03-10T17:30:00.000Z");
});
