"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Film, RotateCcw } from "lucide-react";
import { cloudinaryUrl, buildTextOverlay } from "@/lib/cloudinary";

// ————— Types —————
type VideoTourProps = {
  videoUrl: string;
  listingTitle: string;
  price: number;
  posterUrl?: string;
};

// Build video URL with branded overlay (title + price text overlays)
const getBrandedOverlayVideoUrl = (publicId: string, title: string, price: number): string => {
  // Build text overlays using the helper function
  // Using Georgia serif font to match page's DM Serif/Fraunces style
  const titleOverlay = buildTextOverlay(title, {
    fontSize: 52,
    fontFamily: "Georgia",
    fontWeight: "bold",
    color: "white",
    position: "south_west",
    x: 40,
    y: 90,
  });
  
  const priceOverlay = buildTextOverlay(`$${price} per month`, {
    fontSize: 36,
    fontFamily: "Georgia",
    fontWeight: "bold",
    color: "#E85D4A",
    position: "south_west",
    x: 40,
    y: 30,
  });

  const transforms = `w_1200,h_675,c_fill/${titleOverlay}/${priceOverlay}`;
  return cloudinaryUrl(publicId, transforms, "video");
};

function resolveVideoSource(videoUrl: string, title: string, price: number): string {
  return /^https?:\/\//i.test(videoUrl)
    ? videoUrl
    : getBrandedOverlayVideoUrl(videoUrl, title, price);
}

// ————— Component —————
export default function VideoTourSection({
  videoUrl,
  listingTitle,
  price,
  posterUrl,
}: VideoTourProps) {
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Build video URL with branded overlay (title + price text)
  const src = resolveVideoSource(videoUrl, listingTitle, price);

  const handleClick = () => {
    if (!videoRef.current) return;
    if (ended) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setEnded(false);
      setPlaying(true);
    } else if (playing) {
      videoRef.current.pause();
      setPlaying(false);
    } else {
      videoRef.current.play();
      setPlaying(true);
    }
  };


  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Film className="w-4 h-4 text-accent" />
          </div>
          <h2
            className="text-2xl tracking-tight text-foreground"
            style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
          >
            Video Tour
          </h2>
        </div>
      </div>


      {/* Video player */}
      <div
        className="relative aspect-video rounded-2xl overflow-hidden bg-black cursor-pointer group"
        onClick={handleClick}
        style={{ cursor: 'pointer' }}
      >
        {hasError ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-warm-gray/10 text-center p-8">
            <Film className="w-12 h-12 text-muted/40 mb-4" />
            <p className="text-foreground/60 font-medium mb-2">Video not available</p>
            <p className="text-sm text-muted/60">
              The video tour for this listing hasn&apos;t been uploaded yet.
            </p>
            {posterUrl && (
              <img
                src={posterUrl}
                alt={listingTitle}
                className="absolute inset-0 w-full h-full object-cover opacity-20"
              />
            )}
          </div>
        ) : (
          <video
            ref={videoRef}
            key={src}
            src={src}
            poster={posterUrl}
            className="w-full h-full object-cover"
            playsInline
            muted
            onError={() => {
              setHasError(true);
              setPlaying(false);
            }}
            onEnded={() => {
              setPlaying(false);
              setEnded(true);
            }}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
        )}

        {/* Play / pause overlay */}
        {!hasError && (
          <motion.div
            initial={false}
            animate={{ opacity: playing ? 0 : 1 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/35 transition-colors pointer-events-none"
          >
            <div className="w-16 h-16 rounded-full bg-white/90 shadow-xl flex items-center justify-center backdrop-blur-sm">
              {ended ? (
                <RotateCcw className="w-6 h-6 text-foreground/70" />
              ) : (
                <Play className="w-6 h-6 text-foreground/70 ml-1" />
              )}
            </div>
          </motion.div>
        )}

      </div>

    </div>
  );
}
