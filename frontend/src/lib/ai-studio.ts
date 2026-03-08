import { cloudinaryUrl } from "./cloudinary";

export type StudioAsset = {
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

export function buildStudioAssetOptions(
  listings: ListingInput[]
): StudioAsset[] {
  const assets: StudioAsset[] = [];

  for (const listing of listings) {
    // Gallery images
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

    // Video poster from highlight URL
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

    // Video poster from videoPublicId
    if (listing.videoPublicId && !listing.highlightUrl) {
      const posterUrl = cloudinaryUrl(
        listing.videoPublicId,
        "so_2,w_900,h_506,c_fill,g_auto",
        "video"
      );
      assets.push({
        id: `${listing._id}-poster`,
        listingId: listing._id,
        listingTitle: listing.title,
        label: `${listing.title} — Video Poster`,
        src: posterUrl,
        transforms: AVAILABLE_TRANSFORMS,
      });
    }
  }

  return assets;
}
