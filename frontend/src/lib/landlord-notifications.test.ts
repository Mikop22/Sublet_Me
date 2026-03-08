import test from "node:test";
import assert from "node:assert/strict";

// Inline for node:test (path aliases don't resolve)
type LandlordNotification = {
  id: string;
  type: "match" | "message" | "tour" | "system";
  title: string;
  description: string;
  timestamp: string;
  unread: boolean;
  listingId?: string;
  studentId?: string;
  conversationId?: string;
};

type ListingRef = { _id: string; title: string };
type MatchRef = { _id: string; listingId: string; tenantId: string; score: number; status: string; createdAt?: string };
type ConversationRef = { _id: string; listingId: string; tenantId: string; unreadByHost: number; messages: { senderId: string; text: string; type: string }[]; lastMessageAt?: string };
type TourRef = { _id: string; listingId: string; tenantId: string; status: string; createdAt?: string };

function buildLandlordNotifications(data: {
  listings: ListingRef[];
  matches: MatchRef[];
  conversations: ConversationRef[];
  tours: TourRef[];
}): { notifications: LandlordNotification[]; unreadCount: number } {
  const titleMap = new Map(data.listings.map((l) => [l._id, l.title]));
  const notifications: LandlordNotification[] = [];

  for (const match of data.matches) {
    if (match.status !== "pending") continue;
    const listingTitle = titleMap.get(match.listingId) ?? "your listing";
    notifications.push({
      id: `match-${match._id}`,
      type: "match",
      title: `New match for ${listingTitle}`,
      description: `A tenant matched with a score of ${match.score}%`,
      timestamp: match.createdAt ?? new Date().toISOString(),
      unread: true,
      listingId: match.listingId,
      studentId: match.tenantId,
    });
  }

  for (const convo of data.conversations) {
    if (convo.unreadByHost <= 0) continue;
    const listingTitle = titleMap.get(convo.listingId) ?? "your listing";
    const lastMsg = convo.messages.at(-1);
    const preview = lastMsg?.text
      ? lastMsg.text.length > 80
        ? lastMsg.text.slice(0, 77) + "..."
        : lastMsg.text
      : "New message";
    notifications.push({
      id: `msg-${convo._id}`,
      type: "message",
      title: `New message on ${listingTitle}`,
      description: preview,
      timestamp: convo.lastMessageAt ?? new Date().toISOString(),
      unread: true,
      listingId: convo.listingId,
      studentId: convo.tenantId,
      conversationId: convo._id,
    });
  }

  for (const tour of data.tours) {
    if (tour.status !== "proposed" && tour.status !== "confirmed") continue;
    const listingTitle = titleMap.get(tour.listingId) ?? "your listing";
    const isProposed = tour.status === "proposed";
    notifications.push({
      id: `tour-${tour._id}`,
      type: "tour",
      title: isProposed ? `Tour proposed for ${listingTitle}` : `Tour confirmed for ${listingTitle}`,
      description: isProposed ? "A tenant has proposed a virtual tour" : "A virtual tour has been confirmed",
      timestamp: tour.createdAt ?? new Date().toISOString(),
      unread: isProposed,
      listingId: tour.listingId,
      studentId: tour.tenantId,
    });
  }

  notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const unreadCount = notifications.filter((n) => n.unread).length;
  return { notifications, unreadCount };
}

test("creates match notifications from pending matches", () => {
  const result = buildLandlordNotifications({
    listings: [{ _id: "l1", title: "Sunny Studio" }],
    matches: [{ _id: "m1", listingId: "l1", tenantId: "t1", score: 90, status: "pending", createdAt: "2026-03-01T00:00:00Z" }],
    conversations: [],
    tours: [],
  });
  assert.equal(result.notifications.some((n) => n.type === "match"), true);
  assert.equal(result.notifications[0].title.includes("Sunny Studio"), true);
});

test("skips non-pending matches", () => {
  const result = buildLandlordNotifications({
    listings: [{ _id: "l1", title: "Sunny Studio" }],
    matches: [{ _id: "m1", listingId: "l1", tenantId: "t1", score: 90, status: "contacted", createdAt: "2026-03-01T00:00:00Z" }],
    conversations: [],
    tours: [],
  });
  assert.equal(result.notifications.length, 0);
});

test("creates message notifications from unread conversations", () => {
  const result = buildLandlordNotifications({
    listings: [{ _id: "l1", title: "Sunny Studio" }],
    matches: [],
    conversations: [{
      _id: "c1", listingId: "l1", tenantId: "t1", unreadByHost: 2,
      messages: [{ senderId: "t1", text: "Is this available?", type: "text" }],
      lastMessageAt: "2026-03-01T12:00:00Z",
    }],
    tours: [],
  });
  assert.equal(result.notifications.some((n) => n.type === "message"), true);
  assert.equal(result.unreadCount > 0, true);
});

test("creates tour notifications", () => {
  const result = buildLandlordNotifications({
    listings: [{ _id: "l1", title: "Sunny Studio" }],
    matches: [],
    conversations: [],
    tours: [{ _id: "t1", listingId: "l1", tenantId: "t1", status: "proposed", createdAt: "2026-03-02T00:00:00Z" }],
  });
  assert.equal(result.notifications.some((n) => n.type === "tour"), true);
});

test("returns sorted by timestamp descending", () => {
  const result = buildLandlordNotifications({
    listings: [{ _id: "l1", title: "Sunny Studio" }],
    matches: [{ _id: "m1", listingId: "l1", tenantId: "t1", score: 90, status: "pending", createdAt: "2026-03-01T00:00:00Z" }],
    conversations: [{
      _id: "c1", listingId: "l1", tenantId: "t1", unreadByHost: 1,
      messages: [{ senderId: "t1", text: "Hello", type: "text" }],
      lastMessageAt: "2026-03-02T00:00:00Z",
    }],
    tours: [],
  });
  const timestamps = result.notifications.map((n) => new Date(n.timestamp).getTime());
  for (let i = 1; i < timestamps.length; i++) {
    assert.equal(timestamps[i] <= timestamps[i - 1], true);
  }
});

test("returns empty for no data", () => {
  const result = buildLandlordNotifications({ listings: [], matches: [], conversations: [], tours: [] });
  assert.equal(result.notifications.length, 0);
  assert.equal(result.unreadCount, 0);
});
