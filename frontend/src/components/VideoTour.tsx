"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Film, Wand2, Type, Sparkles, RotateCcw } from "lucide-react";
import { cloudinaryVideoFetchUrl } from "@/lib/cloudinary";

// ————— Types —————
type VideoTourProps = {
  videoUrl: string;
  listingTitle: string;
  price: number;
  posterUrl?: string;
};

type Mode = {
  id: string;
  label: string;
  brief: string;
  description: string;
  icon: React.ReactNode;
  getVideoUrl: (videoUrl: string, title: string, price: number) => string;
  loop?: boolean;
};

// ————— Video transformation modes —————
const MODES: Mode[] = [
  {
    id: "full",
    label: "Full Tour",
    brief: "CDN-optimized HD delivery",
    description:
      "HD video delivered through Cloudinary\u2019s global CDN with automatic format selection (WebM where supported) and adaptive quality optimization.",
    icon: <Film className="w-4 h-4" />,
    getVideoUrl: (url) => cloudinaryVideoFetchUrl(url, "w_1200,h_675,c_fill"),
  },
  {
    id: "preview",
    label: "AI Preview",
    brief: "Smart 5-second highlight",
    description:
      "Cloudinary AI analyzes the full tour video and generates a smart 5-second highlight clip \u2014 ideal for listing cards and social media previews.",
    icon: <Wand2 className="w-4 h-4" />,
    getVideoUrl: (url) =>
      cloudinaryVideoFetchUrl(url, "w_1200,h_675,c_fill/e_preview:duration_5"),
    loop: true,
  },
  {
    id: "overlay",
    label: "Branded Overlay",
    brief: "Dynamic listing info layer",
    description:
      "Listing name and price are dynamically composed onto the video via Cloudinary\u2019s text overlay API \u2014 ready for social media, no editing software required.",
    icon: <Type className="w-4 h-4" />,
    getVideoUrl: (url, title, price) => {
      const safe = title.replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 28);
      const encoded = safe.replace(/ /g, "%20");
      return cloudinaryVideoFetchUrl(
        url,
        `w_1200,h_675,c_fill/l_text:arial_52_bold:${encoded},co_white,g_south_west,x_40,y_90/l_text:arial_36:%24${price}%20per%20month,co_rgb:E85D4A,g_south_west,x_40,y_30`,
      );
    },
  },
];

// ————— Component —————
export default function VideoTourSection({
  videoUrl,
  listingTitle,
  price,
  posterUrl,
}: VideoTourProps) {
  const [activeMode, setActiveMode] = useState(MODES[0]);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const src = activeMode.getVideoUrl(videoUrl, listingTitle, price);

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

  const switchMode = (mode: Mode) => {
    setActiveMode(mode);
    setPlaying(false);
    setEnded(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
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
      >
        <video
          ref={videoRef}
          key={src}
          src={src}
          poster={posterUrl}
          className="w-full h-full object-cover"
          playsInline
          muted
          loop={activeMode.loop}
          onEnded={() => {
            setPlaying(false);
            setEnded(true);
          }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />

        {/* Play / pause overlay */}
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

        {/* Mode badge */}
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 pointer-events-none">
          {activeMode.icon}
          {activeMode.label}
        </div>

        {activeMode.loop && (
          <div className="absolute top-4 right-4 bg-accent/80 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider pointer-events-none">
            5s clip
          </div>
        )}
      </div>

    </div>
  );
}
