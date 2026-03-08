import type {
  LandlordDashboardTotals,
  LandlordListingStatus,
  LandlordListingSummary,
} from "@/lib/landlord-types";

type DateValue = Date | string;

export type LandlordListingRecord = {
  _id: string | { toString(): string };
  title: string;
  address: string;
  price: number;
  dates: {
    start: DateValue;
    end: DateValue;
  };
  status: LandlordListingStatus;
  images?: string[];
  highlightUrl?: string;
  videoProcessing?: boolean;
  stats?: {
    views?: number;
    inquiries?: number;
  };
};

function formatDate(date: DateValue): string {
  return new Date(date).toLocaleDateString("en-US", {
    timeZone: "UTC",
  });
}

export function toLandlordListingSummary(
  listing: LandlordListingRecord,
  matchCount: number
): LandlordListingSummary {
  return {
    id:
      typeof listing._id === "string"
        ? listing._id
        : listing._id.toString(),
    title: listing.title,
    address: listing.address,
    price: listing.price,
    dates: `${formatDate(listing.dates.start)} - ${formatDate(listing.dates.end)}`,
    image: listing.images?.[0] ?? null,
    status: listing.status,
    matches: matchCount,
    views: listing.stats?.views ?? 0,
    inquiries: listing.stats?.inquiries ?? 0,
    videoProcessing: Boolean(listing.videoProcessing),
    highlightUrl: listing.highlightUrl ?? "",
  };
}

export function buildLandlordDashboardPayload({
  listings,
  unreadMessages,
  upcomingTours,
}: {
  listings: LandlordListingSummary[];
  unreadMessages: number;
  upcomingTours: number;
}): {
  listings: LandlordListingSummary[];
  totals: LandlordDashboardTotals;
} {
  return {
    listings,
    totals: {
      activeListings: listings.filter((listing) => listing.status === "active")
        .length,
      totalMatches: listings.reduce((sum, listing) => sum + listing.matches, 0),
      unreadMessages,
      upcomingTours,
    },
  };
}
