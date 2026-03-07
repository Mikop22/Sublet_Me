"use client";

import { AdvancedVideo } from "@cloudinary/react";
import { cld } from "@/lib/cloudinary";
import { fill } from "@cloudinary/url-gen/actions/resize";
import { format, quality } from "@cloudinary/url-gen/actions/delivery";
import { auto as autoFormat } from "@cloudinary/url-gen/qualifiers/format";
import { auto as autoQuality } from "@cloudinary/url-gen/qualifiers/quality";

type CldVideoProps = {
  /** Cloudinary public ID (for uploaded videos) */
  publicId?: string;
  /** Remote URL to fetch through Cloudinary */
  fetchUrl?: string;
  /** Width in pixels */
  width?: number;
  /** Height in pixels */
  height?: number;
  /** Extra transformation string (raw URL syntax) */
  rawTransform?: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  controls?: boolean;
  poster?: string;
};

export default function CldVideo({
  publicId,
  fetchUrl,
  width,
  height,
  rawTransform,
  className,
  autoPlay = false,
  muted = true,
  loop = false,
  playsInline = true,
  controls = false,
  poster,
}: CldVideoProps) {
  let video;

  if (fetchUrl) {
    video = cld.video(fetchUrl).setDeliveryType("fetch");
  } else if (publicId) {
    video = cld.video(publicId);
  } else {
    return null;
  }

  video.delivery(format(autoFormat())).delivery(quality(autoQuality()));

  if (width || height) {
    video.resize(fill().width(width!).height(height!));
  }

  if (rawTransform) {
    video.addTransformation(rawTransform);
  }

  return (
    <AdvancedVideo
      cldVid={video}
      className={className}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      playsInline={playsInline}
      controls={controls}
      poster={poster}
    />
  );
}
