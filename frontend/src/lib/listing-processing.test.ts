import test from "node:test";
import assert from "node:assert/strict";

type ListingProcessingState = "processing" | "ready" | "failed";

function deriveListingProcessingState(input: {
  videoProcessing: boolean;
  highlightUrl: string;
  galleryImages: string[];
}): ListingProcessingState {
  if (input.videoProcessing) return "processing";
  if (input.highlightUrl || input.galleryImages.length > 0) return "ready";
  return "failed";
}

test("returns processing when videoProcessing is true", () => {
  assert.equal(
    deriveListingProcessingState({
      videoProcessing: true,
      highlightUrl: "",
      galleryImages: [],
    }),
    "processing"
  );
});

test("returns ready when highlightUrl exists", () => {
  assert.equal(
    deriveListingProcessingState({
      videoProcessing: false,
      highlightUrl: "https://example.com/highlight.mp4",
      galleryImages: [],
    }),
    "ready"
  );
});

test("returns ready when gallery images exist", () => {
  assert.equal(
    deriveListingProcessingState({
      videoProcessing: false,
      highlightUrl: "",
      galleryImages: ["https://example.com/img1.jpg"],
    }),
    "ready"
  );
});

test("returns failed when processing is false and no media exists", () => {
  assert.equal(
    deriveListingProcessingState({
      videoProcessing: false,
      highlightUrl: "",
      galleryImages: [],
    }),
    "failed"
  );
});

test("processing takes priority over existing media", () => {
  assert.equal(
    deriveListingProcessingState({
      videoProcessing: true,
      highlightUrl: "https://example.com/highlight.mp4",
      galleryImages: ["https://example.com/img1.jpg"],
    }),
    "processing"
  );
});
