import { Cloudinary } from "@cloudinary/url-gen";

// Singleton Cloudinary instance
export const cld = new Cloudinary({
  cloud: {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "demo",
  },
});

/**
 * Build an optimised Cloudinary "fetch" URL for a remote image.
 * This serves ANY remote image (e.g. Unsplash) through Cloudinary's CDN
 * with on-the-fly transformations — no pre-upload required.
 *
 * @param remoteUrl  The original image URL (e.g. Unsplash)
 * @param transforms Extra transformation string segments (comma-separated)
 *                    e.g. "w_800,h_600,c_fill,g_auto"
 */
export function cloudinaryFetchUrl(
  remoteUrl: string,
  transforms?: string,
): string {
  const cloud =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "demo";
  const base = `https://res.cloudinary.com/${cloud}/image/fetch`;
  const parts = ["f_auto", "q_auto"];
  if (transforms) parts.push(transforms);
  return `${base}/${parts.join(",")}/${encodeURIComponent(remoteUrl)}`;
}

/**
 * Build an optimised Cloudinary "fetch" URL for a remote video.
 */
export function cloudinaryVideoFetchUrl(
  remoteUrl: string,
  transforms?: string,
): string {
  const cloud =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "demo";
  const base = `https://res.cloudinary.com/${cloud}/video/fetch`;
  const parts = ["f_auto", "q_auto"];
  if (transforms) parts.push(transforms);
  return `${base}/${parts.join(",")}/${encodeURIComponent(remoteUrl)}`;
}

/**
 * Build a Cloudinary URL for a pre-uploaded asset by public ID.
 */
export function cloudinaryUrl(
  publicId: string,
  transforms?: string,
  resourceType: "image" | "video" = "image",
): string {
  const cloud =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "demo";
  const base = `https://res.cloudinary.com/${cloud}/${resourceType}/upload`;
  const parts = ["f_auto", "q_auto"];
  if (transforms) parts.push(transforms);
  return `${base}/${parts.join(",")}/${publicId}`;
}

/**
 * Generate a poster (thumbnail) frame from a remote video via Cloudinary.
 * Extracts a frame at the given offset and returns it as a JPEG.
 */
export function cloudinaryVideoPosterUrl(
  remoteUrl: string,
  transforms?: string,
  offsetSeconds = 2,
): string {
  const cloud =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "demo";
  const base = `https://res.cloudinary.com/${cloud}/video/fetch`;
  const parts = [`so_${offsetSeconds}`, "f_jpg", "q_auto"];
  if (transforms) parts.push(transforms);
  return `${base}/${parts.join(",")}/${encodeURIComponent(remoteUrl)}`;
}
