"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Sparkles, Wand2, ImageIcon, Maximize, Eraser } from "lucide-react";
import { cloudinaryFetchUrl } from "@/lib/cloudinary";

// ————— Sample listing images to demonstrate transforms —————
const SAMPLE_IMAGES = [
  {
    id: 1,
    label: "Liberty Village Studio",
    src: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1400&h=900&fit=crop&q=85",
  },
  {
    id: 2,
    label: "King West 1BR",
    src: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1400&h=900&fit=crop&q=85",
  },
  {
    id: 3,
    label: "Annex Shared House",
    src: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1400&h=900&fit=crop&q=85",
  },
];

// ————— Available AI transforms —————
type Transform = {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  getUrl: (src: string) => string;
};

const TRANSFORMS: Transform[] = [
  {
    id: "original",
    label: "Original",
    description: "No transformations applied — raw image as uploaded.",
    icon: <ImageIcon className="w-5 h-5" />,
    getUrl: (src) => cloudinaryFetchUrl(src, "w_900,c_fill,g_auto"),
  },
  {
    id: "enhance",
    label: "AI Enhance",
    description: "Generative AI auto-corrects exposure, sharpens details, and restores quality — perfect for low-quality phone photos from students.",
    icon: <Sparkles className="w-5 h-5" />,
    getUrl: (src) => cloudinaryFetchUrl(src, "w_900,c_fill,g_auto/e_enhance"),
  },
  {
    id: "gen-fill",
    label: "Generative Fill",
    description: "AI extends the image to a wider aspect ratio (16:9), seamlessly generating new background content that matches the scene.",
    icon: <Maximize className="w-5 h-5" />,
    getUrl: (src) => cloudinaryFetchUrl(src, "w_900,h_506,c_pad,g_auto,b_gen_fill"),
  },
  {
    id: "bg-replace",
    label: "Background Replace",
    description: "Generative AI replaces the background with a clean, modern living space — making any listing look professionally staged.",
    icon: <Wand2 className="w-5 h-5" />,
    getUrl: (src) =>
      cloudinaryFetchUrl(src, "w_900,c_fill,g_auto/e_gen_background_replace:prompt_modern minimalist bright interior with natural light"),
  },
  {
    id: "bg-remove",
    label: "Background Removal",
    description: "AI removes the background entirely, isolating the foreground subject — useful for creating marketing materials and overlays.",
    icon: <Eraser className="w-5 h-5" />,
    getUrl: (src) => cloudinaryFetchUrl(src, "w_900,c_fill,g_auto/e_background_removal"),
  },
];

// ————— Before/After Slider —————
function CompareSlider({
  beforeUrl,
  afterUrl,
  beforeLabel,
  afterLabel,
}: {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel: string;
  afterLabel: string;
}) {
  const [position, setPosition] = useState(50);

  return (
    <div
      className="relative w-full aspect-video rounded-2xl overflow-hidden cursor-col-resize select-none group"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        setPosition(Math.max(2, Math.min(98, x)));
      }}
      onTouchMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
        setPosition(Math.max(2, Math.min(98, x)));
      }}
    >
      {/* After (full) */}
      <img
        src={afterUrl}
        alt={afterLabel}
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Before (clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${position}%` }}
      >
        <img
          src={beforeUrl}
          alt={beforeLabel}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ minWidth: `${100 / (position / 100)}%`, maxWidth: `${100 / (position / 100)}%` }}
        />
      </div>
      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 w-[3px] bg-white shadow-[0_0_12px_rgba(0,0,0,0.4)] z-10"
        style={{ left: `${position}%`, transform: "translateX(-50%)" }}
      >
        {/* Handle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-foreground/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4M16 15l-4 4-4-4" />
          </svg>
        </div>
      </div>
      {/* Labels */}
      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full z-20">
        {beforeLabel}
      </div>
      <div className="absolute top-4 right-4 bg-accent/90 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full z-20">
        {afterLabel}
      </div>
    </div>
  );
}

// ————— Main Page —————
export default function AIStudioPage() {
  const [selectedImage, setSelectedImage] = useState(SAMPLE_IMAGES[0]);
  const [selectedTransform, setSelectedTransform] = useState(TRANSFORMS[1]); // Default to AI Enhance

  const originalUrl = TRANSFORMS[0].getUrl(selectedImage.src);
  const transformedUrl = selectedTransform.getUrl(selectedImage.src);

  return (
    <div
      className="min-h-screen bg-background"
      style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
    >
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-warm-gray/10">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="font-serif text-xs tracking-[0.25em] uppercase font-semibold text-foreground"
          >
            SUBLET-<span className="text-accent">ME</span>
          </Link>
          <div className="flex items-center gap-2 bg-accent/10 px-3 py-1.5 rounded-full">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-xs font-semibold text-accent">Powered by Cloudinary AI</span>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 pt-8 pb-6">
        <Link
          href="/landlord/dashboard"
          className="flex items-center gap-1.5 text-muted text-sm hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1
            className="text-foreground text-4xl md:text-5xl tracking-tight leading-[1.05] mb-3"
            style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
          >
            AI Photo <span className="text-accent">Studio</span>
          </h1>
          <p className="text-muted text-base max-w-xl leading-relaxed">
            Enhance your listing photos with Cloudinary&apos;s generative AI. Select a listing image
            and apply transformations to see the difference instantly.
          </p>
        </motion.div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
          {/* Left — Compare view */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedImage.id}-${selectedTransform.id}`}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
              >
                {selectedTransform.id === "original" ? (
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden">
                    <img
                      src={originalUrl}
                      alt={selectedImage.label}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                      Original
                    </div>
                  </div>
                ) : (
                  <CompareSlider
                    beforeUrl={originalUrl}
                    afterUrl={transformedUrl}
                    beforeLabel="Original"
                    afterLabel={selectedTransform.label}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Transform description */}
            <motion.div
              key={selectedTransform.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 bg-surface border border-warm-gray/10 rounded-xl p-5"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-accent">{selectedTransform.icon}</span>
                <h3 className="font-semibold text-foreground text-sm">
                  {selectedTransform.label}
                </h3>
              </div>
              <p className="text-muted text-sm leading-relaxed">
                {selectedTransform.description}
              </p>
            </motion.div>
          </motion.div>

          {/* Right — Controls */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            {/* Image picker */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Select listing photo
              </h3>
              <div className="grid grid-cols-3 gap-2.5">
                {SAMPLE_IMAGES.map((img) => (
                  <motion.button
                    key={img.id}
                    onClick={() => setSelectedImage(img)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={`relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                      selectedImage.id === img.id
                        ? "border-accent shadow-[0_0_0_1px_rgba(232,93,74,0.3)]"
                        : "border-transparent hover:border-warm-gray/30"
                    }`}
                  >
                    <img
                      src={cloudinaryFetchUrl(img.src, "w_300,h_225,c_fill,g_auto")}
                      alt={img.label}
                      className="w-full h-full object-cover"
                    />
                    {selectedImage.id === img.id && (
                      <motion.div
                        layoutId="selected-ring"
                        className="absolute inset-0 border-2 border-accent rounded-xl"
                      />
                    )}
                  </motion.button>
                ))}
              </div>
              <p className="text-xs text-muted mt-2">{selectedImage.label}</p>
            </div>

            {/* Transform picker */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                AI Transformation
              </h3>
              <div className="space-y-2">
                {TRANSFORMS.map((t) => (
                  <motion.button
                    key={t.id}
                    onClick={() => setSelectedTransform(t)}
                    whileHover={{ x: 2 }}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left cursor-pointer transition-all border ${
                      selectedTransform.id === t.id
                        ? "bg-accent/[0.06] border-accent/20 shadow-sm"
                        : "bg-surface border-warm-gray/10 hover:bg-warm-gray/[0.04]"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        selectedTransform.id === t.id
                          ? "bg-accent/15 text-accent"
                          : "bg-warm-gray/10 text-muted"
                      }`}
                    >
                      {t.icon}
                    </div>
                    <div>
                      <p
                        className={`text-sm font-semibold ${
                          selectedTransform.id === t.id
                            ? "text-accent"
                            : "text-foreground"
                        }`}
                      >
                        {t.label}
                      </p>
                      <p className="text-[11px] text-muted leading-tight mt-0.5 line-clamp-1">
                        {t.description}
                      </p>
                    </div>
                    {selectedTransform.id === t.id && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Cloudinary badge */}
            <div className="bg-foreground rounded-2xl p-5 text-surface relative overflow-hidden">
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                <svg width="100%" height="100%">
                  <defs>
                    <filter id="noise-studio">
                      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
                    </filter>
                  </defs>
                  <rect width="100%" height="100%" filter="url(#noise-studio)" />
                </svg>
              </div>
              <div className="relative z-10">
                <p className="text-accent text-[10px] font-semibold uppercase tracking-[0.2em] mb-2">
                  Powered by
                </p>
                <p className="text-surface text-lg font-bold tracking-tight">
                  Cloudinary AI
                </p>
                <p className="text-surface/40 text-xs mt-1.5 leading-relaxed">
                  All transformations are performed on-the-fly via URL parameters —
                  no server-side processing required.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
