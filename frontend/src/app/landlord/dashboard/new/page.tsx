"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, X, Video } from "lucide-react";
import { ListingFormValidationError, parseListingAvailability } from "@/lib/listing-form";
import { buildCloudinaryVideoUploadUrl } from "@/lib/cloudinary-upload";

export default function NewListingPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [price, setPrice] = useState(0);
  const [datesStart, setDatesStart] = useState("");
  const [datesEnd, setDatesEnd] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStage, setSubmitStage] = useState<
    "idle" | "uploading" | "creating" | "processing" | "done"
  >("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [rules, setRules] = useState("");

  const [video, setVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const uploadVideoToCloudinary = async (file: File): Promise<string> => {
    if (!file.type.startsWith("video/")) {
      throw new ListingFormValidationError("File must be a video");
    }

    const signResponse = await fetch("/api/uploads/cloudinary-sign", {
      method: "POST",
    });
    const signPayload = (await signResponse.json().catch(() => null)) as
      | {
          cloudName?: string;
          apiKey?: string;
          folder?: string;
          timestamp?: number;
          signature?: string;
          error?: string;
        }
      | null;

    if (!signResponse.ok) {
      throw new Error(signPayload?.error ?? "Could not authorize video upload");
    }

    const uploadUrl = buildCloudinaryVideoUploadUrl(signPayload?.cloudName ?? "");
    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("api_key", signPayload?.apiKey ?? "");
    uploadData.append("timestamp", String(signPayload?.timestamp ?? ""));
    uploadData.append("signature", signPayload?.signature ?? "");
    uploadData.append("folder", signPayload?.folder ?? "");

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      body: uploadData,
    });
    const uploadPayload = (await uploadResponse.json().catch(() => null)) as
      | {
          public_id?: string;
          error?: {
            message?: string;
          };
        }
      | null;

    if (!uploadResponse.ok || typeof uploadPayload?.public_id !== "string") {
      throw new Error(
        uploadPayload?.error?.message ?? "Could not upload video to Cloudinary"
      );
    }

    return uploadPayload.public_id;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    try {
      parseListingAvailability({ datesStart, datesEnd });

      if (!video) {
        throw new ListingFormValidationError("Property video is required");
      }

      setIsSubmitting(true);
      setSubmitStage("uploading");

      const videoPublicId = await uploadVideoToCloudinary(video);
      setSubmitStage("creating");

      const res = await fetch("/api/pipeline/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoPublicId,
          title,
          address,
          price,
          datesStart,
          datesEnd,
          status: "active",
          rules: rules.trim() ? rules.split(/\n|,/).map((r) => r.trim()).filter(Boolean) : [],
        }),
      });
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;

      setSubmitStage("done");
      if (res.ok) {
        setSubmitStage("processing");
        await new Promise((resolve) => setTimeout(resolve, 2000));
        router.push("/landlord/dashboard");
        router.refresh();
        return;
      }

      throw new Error(payload?.error ?? "Could not create listing");
    } catch (error) {
      setIsSubmitting(false);
      setSubmitStage("idle");
      setSubmitError(
        error instanceof Error ? error.message : "Could not create listing"
      );
    }
  };

  return (
    <div
      className="min-h-screen bg-background"
      style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
    >
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-warm-gray/10">
        <div className="px-6 lg:px-10 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="font-serif text-xs tracking-[0.25em] uppercase font-semibold text-foreground"
          >
            SUBLET-<span className="text-accent">ME</span>
          </Link>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-orange-400 flex items-center justify-center text-white font-semibold text-xs cursor-pointer ring-2 ring-background shadow-sm">
            J
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 lg:px-10 pt-6 pb-8">
        {/* Back link */}
        <Link
          href="/landlord/dashboard"
          className="inline-flex items-center gap-1.5 text-muted text-sm hover:text-foreground transition-colors mb-5"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>

        {/* Hero */}
        <div className="mb-6">
          <h1
            className="text-2xl md:text-3xl text-foreground tracking-tight"
            style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
          >
            Post your place in seconds
          </h1>
          <p className="text-muted text-sm mt-1.5">
            Upload a video walkthrough and we handle the rest — photos, descriptions, and matching.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left column — Video upload */}
            <div>
              <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-2">
                Video walkthrough
              </label>
              {videoPreview ? (
                <div className="relative rounded-xl overflow-hidden border-2 border-warm-gray/20">
                  <video
                    src={videoPreview}
                    controls
                    className="w-full h-52 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (videoPreview) URL.revokeObjectURL(videoPreview);
                      setVideoPreview(null);
                      setVideo(null);
                      if (videoInputRef.current) videoInputRef.current.value = "";
                    }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="w-full h-52 rounded-xl border-2 border-dashed border-warm-gray/30 hover:border-accent/40 bg-warm-gray/5 flex flex-col items-center justify-center gap-2 transition-colors group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-accent/10 group-hover:bg-accent/20 flex items-center justify-center transition-colors">
                    <Video className="w-6 h-6 text-accent" />
                  </div>
                  <span className="text-sm font-medium text-muted group-hover:text-foreground transition-colors">
                    Click to upload video
                  </span>
                  <span className="text-xs text-muted/60">MP4, MOV, or WEBM</span>
                </button>
              )}
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (videoPreview) URL.revokeObjectURL(videoPreview);
                  setVideo(file);
                  setVideoPreview(URL.createObjectURL(file));
                }}
              />
              <p className="text-[11px] text-muted/60 mt-2">
                We extract photos, generate a highlight clip, and write the description from your video.
              </p>
            </div>

            {/* Right column — Details */}
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Sunny Studio near campus"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-warm-gray/5 border border-warm-gray/20 text-foreground text-sm focus:outline-none focus:border-accent/40 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
                  Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 College St, Toronto"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-warm-gray/5 border border-warm-gray/20 text-foreground text-sm focus:outline-none focus:border-accent/40 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
                  Monthly rent
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-sm">$</span>
                  <input
                    type="number"
                    value={price || ""}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    placeholder="1200"
                    className="w-full pl-7 pr-3.5 py-2.5 rounded-lg bg-warm-gray/5 border border-warm-gray/20 text-foreground text-sm focus:outline-none focus:border-accent/40 transition-colors"
                    required
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
                    Move-in
                  </label>
                  <input
                    type="date"
                    value={datesStart}
                    onChange={(e) => setDatesStart(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-warm-gray/5 border border-warm-gray/20 text-foreground text-sm focus:outline-none focus:border-accent/40 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
                    Move-out
                  </label>
                  <input
                    type="date"
                    value={datesEnd}
                    min={datesStart || undefined}
                    onChange={(e) => setDatesEnd(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-warm-gray/5 border border-warm-gray/20 text-foreground text-sm focus:outline-none focus:border-accent/40 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
                  House rules <span className="normal-case text-muted/50">(optional)</span>
                </label>
                <textarea
                  value={rules}
                  onChange={(e) => setRules(e.target.value)}
                  placeholder="No smoking, quiet hours after 10pm..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-warm-gray/5 border border-warm-gray/20 text-foreground text-sm focus:outline-none focus:border-accent/40 transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Submit area */}
          <div className="mt-6">
            {submitStage === "processing" && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <p className="font-semibold">Listing created! Video processing has started.</p>
                <p className="mt-1 text-amber-700">
                  Gallery images and the highlight clip will appear automatically.
                </p>
              </div>
            )}
            {submitError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            )}
            <div className="flex items-center justify-end gap-3">
              <Link
                href="/landlord/dashboard"
                className="px-5 py-2.5 rounded-lg border border-warm-gray/20 text-sm font-medium text-muted hover:bg-warm-gray/5 transition-colors"
              >
                Cancel
              </Link>
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                className="px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold shadow-[0_4px_20px_rgba(232,93,74,0.25)] hover:shadow-[0_6px_30px_rgba(232,93,74,0.35)] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <motion.div
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                    />
                    {submitStage === "uploading"
                      ? "Uploading video..."
                      : submitStage === "processing"
                        ? "Processing started..."
                        : "Creating listing..."}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Create Listing
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
