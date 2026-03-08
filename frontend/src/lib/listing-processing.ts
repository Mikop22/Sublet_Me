export type ListingProcessingState = "processing" | "ready" | "failed";

export function deriveListingProcessingState(input: {
  videoProcessing: boolean;
  highlightUrl: string;
  galleryImages: string[];
}): ListingProcessingState {
  if (input.videoProcessing) return "processing";
  if (input.highlightUrl || input.galleryImages.length > 0) return "ready";
  return "failed";
}

export const PROCESSING_COPY = {
  processing: "Your video is being processed. Gallery images will appear shortly.",
  failed:
    "The listing was created, but media generation did not complete. The listing is still usable without generated media.",
  ready: "",
} as const;
