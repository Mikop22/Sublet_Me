"use client";

import { AdvancedImage, lazyload, responsive } from "@cloudinary/react";
import { cld } from "@/lib/cloudinary";
import { fill, pad } from "@cloudinary/url-gen/actions/resize";
import { autoGravity } from "@cloudinary/url-gen/qualifiers/gravity";
import { format, quality } from "@cloudinary/url-gen/actions/delivery";
import { auto as autoFormat } from "@cloudinary/url-gen/qualifiers/format";
import { auto as autoQuality } from "@cloudinary/url-gen/qualifiers/quality";
import { generativeFill } from "@cloudinary/url-gen/qualifiers/background";

type CldImageProps = {
  /** Cloudinary public ID (for uploaded assets) */
  publicId?: string;
  /** Remote URL to fetch through Cloudinary (for external images) */
  fetchUrl?: string;
  /** Width in pixels */
  width?: number;
  /** Height in pixels */
  height?: number;
  /** Crop mode: "fill" (default) or "pad" (with gen-fill) */
  crop?: "fill" | "pad" | "gen-fill";
  alt: string;
  className?: string;
};

/**
 * Wrapper around Cloudinary's AdvancedImage that supports both
 * uploaded assets (publicId) and remote fetch URLs.
 * Automatically applies f_auto, q_auto, responsive, and lazyload.
 */
export default function CldImage({
  publicId,
  fetchUrl,
  width,
  height,
  crop = "fill",
  alt,
  className,
}: CldImageProps) {
  let img;

  if (fetchUrl) {
    img = cld.image(fetchUrl).setDeliveryType("fetch");
  } else if (publicId) {
    img = cld.image(publicId);
  } else {
    return null;
  }

  // Auto format + quality
  img.delivery(format(autoFormat())).delivery(quality(autoQuality()));

  // Resize
  if (width || height) {
    const w = width!;
    const h = height!;
    if (crop === "gen-fill") {
      img.resize(
        pad()
          .width(w)
          .height(h)
          .gravity(autoGravity())
          .background(generativeFill())
      );
    } else if (crop === "pad") {
      img.resize(pad().width(w).height(h).gravity(autoGravity()));
    } else {
      img.resize(fill().width(w).height(h).gravity(autoGravity()));
    }
  }

  return (
    <AdvancedImage
      cldImg={img}
      plugins={[lazyload(), responsive({ steps: 200 })]}
      alt={alt}
      className={className}
    />
  );
}
