import type { LandlordNotification } from "./landlord-types";

type ListingRef = { _id: string; title: string };
type MatchRef = {
  _id: string;
  listingId: string;
  tenantId: string;
  score: number;
  status: string;
  createdAt?: string;
};
type ConversationRef = {
  _id: string;
  listingId: string;
  tenantId: string;
  unreadByHost: number;
  messages: { senderId: string; text: string; type: string }[];
  lastMessageAt?: string;
};
type TourRef = {
  _id: string;
  listingId: string;
  tenantId: string;
  status: string;
  createdAt?: string;
};

type NotificationInput = {
  listings: ListingRef[];
  matches: MatchRef[];
  conversations: ConversationRef[];
  tours: TourRef[];
};

export function buildLandlordNotifications(data: NotificationInput): {
  notifications: LandlordNotification[];
  unreadCount: number;
} {
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
      title: isProposed
        ? `Tour proposed for ${listingTitle}`
        : `Tour confirmed for ${listingTitle}`,
      description: isProposed
        ? "A tenant has proposed a virtual tour"
        : "A virtual tour has been confirmed",
      timestamp: tour.createdAt ?? new Date().toISOString(),
      unread: isProposed,
      listingId: tour.listingId,
      studentId: tour.tenantId,
    });
  }

  notifications.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const unreadCount = notifications.filter((n) => n.unread).length;
  return { notifications, unreadCount };
}
