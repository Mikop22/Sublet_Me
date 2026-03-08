"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, X } from "lucide-react";
import { type ListingStatus } from "@/lib/landlord-mock";
import { TERMS } from "@/app/create-profile/shared-components";

const LIFESTYLES = [
  { label: "Early bird", emoji: "🌅" },
  { label: "Night owl", emoji: "🦉" },
  { label: "Quiet & studious", emoji: "📚" },
  { label: "Social butterfly", emoji: "🦋" },
  { label: "Introvert", emoji: "🐢" },
  { label: "Extrovert", emoji: "🦚" },
  { label: "Homebody", emoji: "🛋️" },
  { label: "Party goer", emoji: "🎊" },
  { label: "Neat freak", emoji: "✨" },
  { label: "Cooks often", emoji: "🍳" },
  { label: "Takeout fan", emoji: "🥡" },
  { label: "Vegan / Veg", emoji: "🥗" },
  { label: "Foodie", emoji: "🍜" },
  { label: "Pet friendly", emoji: "🐾" },
  { label: "Plant parent", emoji: "🪴" },
  { label: "Non-smoker", emoji: "🚭" },
  { label: "Fitness lover", emoji: "💪" },
  { label: "Gym rat", emoji: "🏋️" },
  { label: "Outdoorsy", emoji: "🏕️" },
  { label: "Gamer", emoji: "🎮" },
  { label: "Techie", emoji: "💻" },
  { label: "Movie buff", emoji: "🍿" },
  { label: "Bookworm", emoji: "📖" },
  { label: "Musician", emoji: "🎸" },
  { label: "LGBTQ+ friendly", emoji: "🌈" },
];

export default function NewListingPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [price, setPrice] = useState(0);
  const [dates, setDates] = useState("");
  const [status, setStatus] = useState<ListingStatus>("active");

  // Requirements
  const [budgetMin, setBudgetMin] = useState(0);
  const [budgetMax, setBudgetMax] = useState(0);
  const [lifestyleTags, setLifestyleTags] = useState<string[]>([]);
  const [termPreference, setTermPreference] = useState("");
  const [petPolicy, setPetPolicy] = useState<"no-pets" | "pets-ok">("no-pets");
  const [genderPreference, setGenderPreference] = useState<"no-preference" | "male" | "female" | "non-binary">(
    "no-preference"
  );
  const [occupants, setOccupants] = useState(1);
  const [referencesRequired, setReferencesRequired] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStage, setSubmitStage] = useState<"idle" | "uploading" | "done">("idle");

  const [video, setVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const toggleLifestyle = (tag: string) => {
    setLifestyleTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStage("uploading");

    const fd = new FormData();
    if (video) fd.append("video", video);
    fd.append("title", title);
    fd.append("address", address);
    fd.append("price", String(price));
    fd.append("datesStart", dates.split(" - ")[0] ?? "");
    fd.append("datesEnd", dates.split(" - ")[1] ?? "");
    fd.append("status", status);
    fd.append("budgetMin", String(budgetMin));
    fd.append("budgetMax", String(budgetMax));
    fd.append("termPreference", termPreference);
    fd.append("petPolicy", petPolicy);
    fd.append("genderPreference", genderPreference);
    fd.append("occupants", String(occupants));
    fd.append("referencesRequired", String(referencesRequired));
    fd.append("lifestyleTags", JSON.stringify(lifestyleTags));

    const res = await fetch("/api/pipeline/process", { method: "POST", body: fd });

    setSubmitStage("done");
    if (res.ok) {
      router.push("/landlord/dashboard");
      router.refresh();
    } else {
      setIsSubmitting(false);
      setSubmitStage("idle");
    }
  };

  return (
    <div
      className="min-h-screen bg-background"
      style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
    >
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-warm-gray/10">
        <div className="px-6 lg:px-10 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="font-serif text-xs tracking-[0.25em] uppercase font-semibold text-foreground"
          >
            SUBLET-<span className="text-accent">ME</span>
          </Link>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-orange-400 flex items-center justify-center text-white font-semibold text-sm cursor-pointer ring-2 ring-background shadow-sm">
            J
          </div>
        </div>
      </nav>

      {/* Page header */}
      <div className="max-w-4xl mx-auto px-6 lg:px-10 pt-8 pb-6">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/landlord/dashboard"
            className="flex items-center gap-1.5 text-muted text-sm hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <span className="text-warm-gray/30">/</span>
          <h1
            className="text-foreground text-xl tracking-tight"
            style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
          >
            Create Listing
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 pb-20">
          {/* Basic Information */}
          <div className="space-y-5">
            <h2
              className="text-foreground text-lg tracking-tight mb-4"
              style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
            >
              Basic Information
            </h2>

            <div>
              <label className="block text-sm font-medium text-muted mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-warm-gray/5 border-2 border-warm-gray/20 text-foreground focus:outline-none focus:border-accent/40 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-2">
                Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-warm-gray/5 border-2 border-warm-gray/20 text-foreground focus:outline-none focus:border-accent/40 transition-colors"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted mb-2">
                  Monthly Price ($)
                </label>
                <input
                  type="number"
                  value={price || ""}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-warm-gray/5 border-2 border-warm-gray/20 text-foreground focus:outline-none focus:border-accent/40 transition-colors"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-2">
                  Availability Dates
                </label>
                <input
                  type="text"
                  value={dates}
                  onChange={(e) => setDates(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-warm-gray/5 border-2 border-warm-gray/20 text-foreground focus:outline-none focus:border-accent/40 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ListingStatus)}
                className="w-full px-4 py-3 rounded-xl bg-warm-gray/5 border-2 border-warm-gray/20 text-foreground focus:outline-none focus:border-accent/40 transition-colors"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="filled">Filled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-2">
                Property Video
              </label>
              <div className="space-y-3">
                {videoPreview && (
                  <div className="relative w-full rounded-xl overflow-hidden border-2 border-warm-gray/20">
                    <video
                      src={videoPreview}
                      controls
                      className="w-full max-h-72 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setVideoPreview(null);
                        setVideo(null);
                        if (videoInputRef.current) videoInputRef.current.value = "";
                      }}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setVideo(file);
                    setVideoPreview(URL.createObjectURL(file));
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-warm-gray/5 border-2 border-warm-gray/20 text-foreground focus:outline-none focus:border-accent/40 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="space-y-5">
            <h2
              className="text-foreground text-lg tracking-tight mb-4"
              style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
            >
              Requirements
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted mb-2">
                  Minimum Budget ($)
                </label>
                <input
                  type="number"
                  value={budgetMin || ""}
                  onChange={(e) => setBudgetMin(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-warm-gray/5 border-2 border-warm-gray/20 text-foreground focus:outline-none focus:border-accent/40 transition-colors"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-2">
                  Maximum Budget ($)
                </label>
                <input
                  type="number"
                  value={budgetMax || ""}
                  onChange={(e) => setBudgetMax(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-warm-gray/5 border-2 border-warm-gray/20 text-foreground focus:outline-none focus:border-accent/40 transition-colors"
                  required
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-2">
                Term Preference
              </label>
              <select
                value={termPreference}
                onChange={(e) => setTermPreference(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-warm-gray/5 border-2 border-warm-gray/20 text-foreground focus:outline-none focus:border-accent/40 transition-colors"
                required
              >
                <option value="">Select term</option>
                {TERMS.map((term) => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-2">
                Pet Policy
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPetPolicy("no-pets")}
                  className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                    petPolicy === "no-pets"
                      ? "border-accent bg-accent/5 text-foreground"
                      : "border-warm-gray/20 bg-warm-gray/5 text-muted hover:border-warm-gray/30"
                  }`}
                >
                  No Pets
                </button>
                <button
                  type="button"
                  onClick={() => setPetPolicy("pets-ok")}
                  className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                    petPolicy === "pets-ok"
                      ? "border-accent bg-accent/5 text-foreground"
                      : "border-warm-gray/20 bg-warm-gray/5 text-muted hover:border-warm-gray/30"
                  }`}
                >
                  Pets OK
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-2">
                Gender Preference
              </label>
              <select
                value={genderPreference}
                onChange={(e) =>
                  setGenderPreference(
                    e.target.value as "no-preference" | "male" | "female" | "non-binary"
                  )
                }
                className="w-full px-4 py-3 rounded-xl bg-warm-gray/5 border-2 border-warm-gray/20 text-foreground focus:outline-none focus:border-accent/40 transition-colors"
              >
                <option value="no-preference">No Preference</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-2">
                Number of Occupants
              </label>
              <input
                type="number"
                value={occupants}
                onChange={(e) => setOccupants(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-warm-gray/5 border-2 border-warm-gray/20 text-foreground focus:outline-none focus:border-accent/40 transition-colors"
                required
                min="1"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="references"
                checked={referencesRequired}
                onChange={(e) => setReferencesRequired(e.target.checked)}
                className="w-5 h-5 rounded border-warm-gray/30 text-accent focus:ring-accent/20 cursor-pointer"
              />
              <label htmlFor="references" className="text-sm text-foreground cursor-pointer">
                References Required
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-3">
                Lifestyle Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {LIFESTYLES.map(({ label, emoji }) => {
                  const selected = lifestyleTags.includes(label);
                  return (
                    <motion.button
                      key={label}
                      type="button"
                      onClick={() => toggleLifestyle(label)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        selected
                          ? "bg-foreground text-surface"
                          : "bg-warm-gray/10 text-foreground/70 hover:bg-warm-gray/20"
                      }`}
                    >
                      <span>{emoji}</span>
                      {label}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-warm-gray/10">
            <Link
              href="/landlord/dashboard"
              className="px-6 py-3 rounded-xl border border-warm-gray/20 text-sm font-medium text-muted hover:bg-warm-gray/5 transition-colors"
            >
              Cancel
            </Link>
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
              className="px-6 py-3 rounded-xl bg-accent text-white text-sm font-semibold shadow-[0_4px_20px_rgba(232,93,74,0.25)] hover:shadow-[0_6px_30px_rgba(232,93,74,0.35)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <motion.div
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                  />
                  {submitStage === "uploading" ? "Uploading video..." : "Creating listing..."}
                </span>
              ) : (
                "Create Listing"
              )}
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
}
