import test from "node:test";
import assert from "node:assert/strict";

type StudioAsset = {
  id: string;
  listingId: string;
  listingTitle: string;
  label: string;
  src: string;
  transforms: { id: string; label: string }[];
};

type ListingInput = {
  _id: string;
  title: string;
  images: string[];
  highlightUrl?: string;
  videoPublicId?: string;
};

const AVAILABLE_TRANSFORMS = [
  { id: "original", label: "Original" },
  { id: "enhance", label: "AI Enhance" },
  { id: "gen-fill", label: "Generative Fill" },
  { id: "bg-replace", label: "Background Replace" },
  { id: "bg-remove", label: "Background Removal" },
];

function buildStudioAssetOptions(listings: ListingInput[]): StudioAsset[] {
  const assets: StudioAsset[] = [];
  for (const listing of listings) {
    for (let i = 0; i < listing.images.length; i++) {
      assets.push({
        id: `${listing._id}-img-${i}`,
        listingId: listing._id,
        listingTitle: listing.title,
        label: `${listing.title} — Photo ${i + 1}`,
        src: listing.images[i],
        transforms: AVAILABLE_TRANSFORMS,
      });
    }
    if (listing.highlightUrl) {
      assets.push({
        id: `${listing._id}-highlight`,
        listingId: listing._id,
        listingTitle: listing.title,
        label: `${listing.title} — Highlight Poster`,
        src: listing.highlightUrl,
        transforms: AVAILABLE_TRANSFORMS,
      });
    }
    if (listing.videoPublicId && !listing.highlightUrl) {
      assets.push({
        id: `${listing._id}-poster`,
        listingId: listing._id,
        listingTitle: listing.title,
        label: `${listing.title} — Video Poster`,
        src: `https://res.cloudinary.com/demo/video/upload/f_auto,q_auto,so_2,w_900,h_506,c_fill,g_auto/${listing.videoPublicId}`,
        transforms: AVAILABLE_TRANSFORMS,
      });
    }
  }
  return assets;
}

test("buildStudioAssetOptions returns assets for listing images", () => {
  const assets = buildStudioAssetOptions([
    { _id: "l1", title: "Sunny Studio", images: ["https://example.com/img1.jpg", "https://example.com/img2.jpg"], highlightUrl: "" },
  ]);
  assert.equal(assets.length, 2);
  assert.equal(assets[0].label, "Sunny Studio — Photo 1");
  assert.equal(assets[0].transforms.some((t) => t.id === "enhance"), true);
});

test("buildStudioAssetOptions includes highlight poster", () => {
  const assets = buildStudioAssetOptions([
    { _id: "l1", title: "Sunny Studio", images: [], highlightUrl: "https://example.com/highlight.mp4" },
  ]);
  assert.equal(assets.length, 1);
  assert.equal(assets[0].label.includes("Highlight Poster"), true);
});

test("buildStudioAssetOptions includes video poster when no highlight", () => {
  const assets = buildStudioAssetOptions([
    { _id: "l1", title: "Sunny Studio", images: [], videoPublicId: "subletme/listings/abc123" },
  ]);
  assert.equal(assets.length, 1);
  assert.equal(assets[0].label.includes("Video Poster"), true);
});

test("buildStudioAssetOptions returns empty for no media", () => {
  const assets = buildStudioAssetOptions([
    { _id: "l1", title: "Sunny Studio", images: [] },
  ]);
  assert.equal(assets.length, 0);
});

test("buildStudioAssetOptions handles multiple listings", () => {
  const assets = buildStudioAssetOptions([
    { _id: "l1", title: "Studio A", images: ["img1.jpg"] },
    { _id: "l2", title: "Studio B", images: ["img2.jpg", "img3.jpg"] },
  ]);
  assert.equal(assets.length, 3);
  assert.equal(assets[0].listingTitle, "Studio A");
  assert.equal(assets[1].listingTitle, "Studio B");
});
