import assert from "node:assert/strict";
import test from "node:test";

import {
  buildLandlordDashboardPayload,
  toLandlordListingSummary,
  type LandlordListingRecord,
} from "./landlord-listings.ts";

function makeListing(overrides: Partial<LandlordListingRecord> = {}): LandlordListingRecord {
  return {
    _id: "listing-1",
    title: "Sunny Studio",
    address: "45 Liberty St, Toronto",
    price: 950,
    dates: {
      start: new Date("2026-05-01T00:00:00.000Z"),
      end: new Date("2026-08-31T00:00:00.000Z"),
    },
    status: "active",
    images: ["https://example.com/cover.jpg"],
    highlightUrl: "https://example.com/highlight.mp4",
    videoProcessing: false,
    stats: {
      views: 38,
      inquiries: 4,
    },
    ...overrides,
  };
}

test("toLandlordListingSummary maps listing fields and match counts for the dashboard", () => {
  const summary = toLandlordListingSummary(makeListing(), 7);

  assert.deepEqual(summary, {
    id: "listing-1",
    title: "Sunny Studio",
    address: "45 Liberty St, Toronto",
    price: 950,
    dates: "5/1/2026 - 8/31/2026",
    image: "https://example.com/cover.jpg",
    status: "active",
    matches: 7,
    views: 38,
    inquiries: 4,
    videoProcessing: false,
    highlightUrl: "https://example.com/highlight.mp4",
  });
});

test("toLandlordListingSummary preserves empty media state for processing listings", () => {
  const summary = toLandlordListingSummary(
    makeListing({
      _id: "listing-2",
      images: [],
      highlightUrl: "",
      videoProcessing: true,
      stats: undefined,
    }),
    0
  );

  assert.equal(summary.id, "listing-2");
  assert.equal(summary.image, null);
  assert.equal(summary.views, 0);
  assert.equal(summary.inquiries, 0);
  assert.equal(summary.videoProcessing, true);
  assert.equal(summary.highlightUrl, "");
});

test("buildLandlordDashboardPayload computes totals from listings and seeded counters", () => {
  const payload = buildLandlordDashboardPayload({
    listings: [
      toLandlordListingSummary(makeListing(), 7),
      toLandlordListingSummary(
        makeListing({
          _id: "listing-2",
          status: "paused",
        }),
        2
      ),
    ],
    unreadMessages: 3,
    upcomingTours: 2,
  });

  assert.deepEqual(payload.totals, {
    activeListings: 1,
    totalMatches: 9,
    unreadMessages: 3,
    upcomingTours: 2,
  });
  assert.equal(payload.listings.length, 2);
});
