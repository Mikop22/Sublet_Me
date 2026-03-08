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

/**
 * Build a Cloudinary text overlay transformation
 * 
 * @param text - The text to display
 * @param options - Overlay options
 * @returns Text overlay transformation string
 */
export function buildTextOverlay(
  text: string,
  options: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: "normal" | "bold";
    color?: string;
    position?: "north" | "south" | "east" | "west" | "center" | "north_west" | "north_east" | "south_west" | "south_east";
    x?: number;
    y?: number;
    background?: string;
  } = {}
): string {
  const {
    fontSize = 40,
    fontFamily = "arial",
    fontWeight = "normal",
    color = "white",
    position = "south_west",
    x = 40,
    y = 40,
    background,
  } = options;

  // Clean text (keep more characters for better display, including $ for prices)
  const safeText = text.replace(/[^a-zA-Z0-9 \-\.,!?'"$]/g, "").substring(0, 50);
  // Cloudinary text overlays need the text to be URL-encoded
  // But we need to encode spaces as %20, not +
  const encodedText = safeText.split(" ").map(encodeURIComponent).join("%20");

  // Build font style - Cloudinary format: font_fontSize_weight
  const fontStyle = fontWeight === "bold" ? `${fontFamily}_${fontSize}_bold` : `${fontFamily}_${fontSize}`;
  
  // Build color - Cloudinary format: co_color or co_rgb:hex
  let colorParam: string;
  if (color.startsWith("#")) {
    // Hex color: co_rgb:RRGGBB
    colorParam = `co_rgb:${color.slice(1)}`;
  } else if (color.includes(",")) {
    // RGB format: co_rgb:RRGGBB
    const rgb = color.match(/\d+/g);
    if (rgb && rgb.length >= 3) {
      const hex = rgb.slice(0, 3).map(n => parseInt(n).toString(16).padStart(2, "0")).join("");
      colorParam = `co_rgb:${hex}`;
    } else {
      colorParam = `co_${color}`;
    }
  } else {
    // Named color: co_white, co_black, etc.
    colorParam = `co_${color}`;
  }
  
  // Build position (gravity)
  const positionMap: Record<string, string> = {
    north: "g_north",
    south: "g_south",
    east: "g_east",
    west: "g_west",
    center: "g_center",
    north_west: "g_north_west",
    north_east: "g_north_east",
    south_west: "g_south_west",
    south_east: "g_south_east",
  };
  const gravity = positionMap[position] || "g_south_west";

  // Build overlay string
  // Cloudinary format: l_text:font_style:text,color,gravity,x_offset,y_offset
  // For background, use b_auto for automatic background
  let overlay = `l_text:${fontStyle}:${encodedText},${colorParam},${gravity},x_${x},y_${y}`;
  
  // Add automatic background for better text visibility
  if (background) {
    overlay += `,b_auto`;
  }

  return overlay;
}

/**
 * Common video transformations you can use:
 * 
 * Resize:
 * - w_1200,h_675,c_fill - Resize to 1200x675, fill crop
 * - w_800,c_scale - Scale to width 800, maintain aspect
 * 
 * Quality & Format:
 * - q_auto - Automatic quality optimization
 * - f_auto - Automatic format (WebM, MP4, etc.)
 * - f_mp4 - Force MP4 format
 * 
 * Video Effects:
 * - e_preview:duration_5 - Generate 5-second preview clip
 * - so_2 - Extract frame at 2 seconds (for thumbnails)
 * - ac_none - Remove audio
 * - du_30 - Limit duration to 30 seconds
 * 
 * Overlays & Text:
 * - l_text:arial_52_bold:Hello,co_white - Add text overlay
 * - Use buildTextOverlay() helper for easier text overlays
 * - l_video:public_id - Overlay another video
 * 
 * Example: "w_1200,h_675,c_fill,q_auto,f_auto,e_preview:duration_5"
 */
