"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// ————— Data —————
export const CITIES = [
  "Toronto",
  "Waterloo",
  "Vancouver",
  "Ottawa",
  "Montreal",
  "Calgary",
  "Edmonton",
  "Halifax",
  "Victoria",
  "London",
];
export const TERMS = ["Summer 2025", "Fall 2025", "Winter 2026", "Summer 2026"];
export const LIFESTYLES = [
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
  { label: "Coffee addict", emoji: "☕" },
  { label: "Pet friendly", emoji: "🐾" },
  { label: "Plant parent", emoji: "🪴" },
  { label: "420 friendly", emoji: "🌿" },
  { label: "Non-smoker", emoji: "🚭" },
  { label: "Teetotaler / Sober", emoji: "🥤" },
  { label: "Wine lover", emoji: "🍷" },
  { label: "Fitness lover", emoji: "💪" },
  { label: "Gym rat", emoji: "🏋️" },
  { label: "Runner", emoji: "🏃" },
  { label: "Yogi", emoji: "🧘" },
  { label: "Outdoorsy", emoji: "🏕️" },
  { label: "Sports fan", emoji: "🏀" },
  { label: "Gamer", emoji: "🎮" },
  { label: "Techie", emoji: "💻" },
  { label: "Movie buff", emoji: "🍿" },
  { label: "Binge watcher", emoji: "📺" },
  { label: "Bookworm", emoji: "📖" },
  { label: "Musician", emoji: "🎸" },
  { label: "Artist", emoji: "🎨" },
  { label: "Photographer", emoji: "📷" },
  { label: "LGBTQ+ friendly", emoji: "🌈" },
  { label: "Eco-friendly", emoji: "♻️" },
  { label: "Astrology fan", emoji: "⭐" },
  { label: "Christian", emoji: "✝️" },
  { label: "Muslim", emoji: "☪️" },
  { label: "Jewish", emoji: "✡️" },
  { label: "Hindu", emoji: "🕉️" },
  { label: "Buddhist", emoji: "☸️" },
  { label: "Atheist / Agnostic", emoji: "🌌" },
  { label: "Spiritual", emoji: "🔮" },
];

// ————— Animations —————
export const stepVariants = {
  enter: (dir: number) => ({
    y: dir > 0 ? 50 : -50,
    opacity: 0,
    filter: "blur(4px)",
  }),
  center: { y: 0, opacity: 1, filter: "blur(0px)" },
  exit: (dir: number) => ({
    y: dir > 0 ? -50 : 50,
    opacity: 0,
    filter: "blur(4px)",
  }),
};

export const stagger = {
  center: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
export const staggerChild = {
  enter: { y: 20, opacity: 0 },
  center: { y: 0, opacity: 1, transition: { duration: 0.45, ease: [0.33, 1, 0.68, 1] as const } },
};

// ————— Floating Input —————
export function FloatingInput({
  label,
  value,
  onChange,
  type = "text",
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  hint?: string;
}) {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;
  const valid = value.length > 2;

  return (
    <div className="relative group">
      <motion.label
        className="absolute left-0 origin-left pointer-events-none select-none"
        animate={{
          y: active ? -8 : 14,
          scale: active ? 0.75 : 1,
          color: focused ? "#E85D4A" : "#6B6560",
        }}
        transition={{ duration: 0.2, ease: [0.33, 1, 0.68, 1] }}
      >
        {label}
      </motion.label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full bg-transparent border-b-2 border-warm-gray/40 pt-5 pb-3 text-foreground text-base focus:outline-none transition-colors"
        style={{
          fontFamily: "var(--font-inter), system-ui, sans-serif",
        }}
      />
      {/* Animated underline */}
      <motion.div
        className="absolute bottom-0 left-1/2 h-[2px] bg-accent -translate-x-1/2"
        animate={{ width: focused ? "100%" : "0%" }}
        transition={{ duration: 0.35, ease: [0.33, 1, 0.68, 1] }}
      />
      {/* Inline checkmark */}
      <AnimatePresence>
        {valid && !focused && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-sage/20 flex items-center justify-center"
          >
            <svg className="w-3.5 h-3.5 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <motion.path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.35 }}
              />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
      {hint && <p className="text-xs text-muted/60 mt-2">{hint}</p>}
    </div>
  );
}

// ————— Avatar Upload —————
export function AvatarUpload({
  avatar,
  setAvatar,
}: {
  avatar: string | null;
  setAvatar: (v: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => setAvatar(e.target?.result as string);
      reader.readAsDataURL(file);
    },
    [setAvatar]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="flex items-center gap-6">
      <motion.div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="relative w-28 h-28 rounded-full cursor-pointer overflow-hidden flex-shrink-0"
      >
        {/* Animated border ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            boxShadow: dragging
              ? [
                "inset 0 0 0 3px rgba(232,93,74,0.6)",
                "inset 0 0 0 3px rgba(232,93,74,0.2)",
                "inset 0 0 0 3px rgba(232,93,74,0.6)",
              ]
              : "inset 0 0 0 2px rgba(212,207,201,0.5)",
          }}
          transition={dragging ? { duration: 1.5, repeat: Infinity } : { duration: 0.3 }}
        />

        {avatar ? (
          <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-warm-gray/10 flex flex-col items-center justify-center gap-1.5">
            <svg
              className="w-7 h-7 text-muted/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
              />
            </svg>
            <span className="text-[10px] text-muted/40 font-medium">Upload</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </motion.div>

      <div className="text-sm text-muted leading-relaxed">
        <p className="font-medium text-foreground mb-1">Profile photo</p>
        <p className="text-muted/70">
          Drag & drop or click to upload.
          <br />
          JPG, PNG under 5MB.
        </p>
        {avatar && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setAvatar(null);
            }}
            className="text-accent text-xs font-semibold mt-1.5 hover:underline cursor-pointer"
          >
            Remove photo
          </button>
        )}
      </div>
    </div>
  );
}

// ————— Budget Slider —————
export function BudgetSlider({
  budget,
  setBudget,
}: {
  budget: number;
  setBudget: (v: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pct = ((budget - 400) / (2500 - 400)) * 100;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-sm font-medium text-muted">Monthly budget</span>
        <motion.span
          key={budget}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="font-serif text-3xl text-foreground tracking-tight"
        >
          ${budget}
        </motion.span>
      </div>

      <div className="relative py-3">
        <div ref={trackRef} className="h-[6px] bg-warm-gray/20 rounded-full relative">
          <motion.div
            className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-accent to-orange-400"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          />
        </div>
        <input
          type="range"
          min={400}
          max={2500}
          step={50}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
          style={{ height: "100%" }}
        />
        {/* Visual thumb */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-[3px] border-accent shadow-[0_2px_10px_rgba(232,93,74,0.3)] pointer-events-none"
          animate={{ left: `calc(${pct}% - 12px)` }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        />
      </div>

      <div className="flex justify-between text-xs text-muted/50 mt-1">
        <span>$400</span>
        <span>$2,500</span>
      </div>
    </div>
  );
}

// ————— Ambient Left Panel —————
const PANEL_MOODS = [
  { greeting: "Hello.", accent: "#E85D4A", secondary: "#F4A261" },
  { greeting: "Where to?", accent: "#A8B5A0", secondary: "#E85D4A" },
  { greeting: "Be yourself.", accent: "#F4A261", secondary: "#A8B5A0" },
  { greeting: "Almost there.", accent: "#E85D4A", secondary: "#A8B5A0" },
];

export function AmbientPanel({ step }: { step: number }) {
  const mood = PANEL_MOODS[step];

  return (
    <>
      {/* Morphing blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            x: step % 2 === 0 ? "10%" : "-15%",
            y: step < 2 ? "-5%" : "10%",
            scale: step === 2 ? 1.3 : 1,
            backgroundColor: mood.accent,
          }}
          transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-[15%] left-[10%] w-[420px] h-[420px] rounded-full blur-[130px] opacity-[0.12]"
        />
        <motion.div
          animate={{
            x: step % 2 === 0 ? "-10%" : "20%",
            y: step < 2 ? "15%" : "-10%",
            scale: step === 1 ? 1.4 : 0.9,
            backgroundColor: mood.secondary,
          }}
          transition={{ duration: 2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="absolute bottom-[10%] right-[5%] w-[380px] h-[380px] rounded-full blur-[120px] opacity-[0.10]"
        />
        <motion.div
          animate={{
            x: step === 0 ? "0%" : step === 1 ? "30%" : step === 2 ? "-20%" : "10%",
            y: step === 0 ? "0%" : step === 1 ? "-20%" : step === 2 ? "25%" : "-15%",
            scale: step === 3 ? 1.5 : 1.1,
            backgroundColor: mood.accent,
          }}
          transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="absolute top-[45%] left-[40%] w-[300px] h-[300px] rounded-full blur-[100px] opacity-[0.06]"
        />
      </div>

      {/* Floating organic shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            rotate: step * 90,
            borderRadius: step % 2 === 0 ? "60% 40% 30% 70% / 60% 30% 70% 40%" : "30% 60% 70% 40% / 50% 60% 30% 60%",
            opacity: 0.04,
          }}
          transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-[20%] right-[15%] w-[200px] h-[200px] border border-white/[0.08]"
        />
        <motion.div
          animate={{
            rotate: -step * 60 + 45,
            borderRadius: step % 2 === 0 ? "40% 60% 50% 50% / 40% 50% 60% 50%" : "50% 40% 60% 50% / 60% 40% 50% 50%",
            opacity: 0.03,
          }}
          transition={{ duration: 2.4, ease: [0.16, 1, 0.3, 1] }}
          className="absolute bottom-[25%] left-[20%] w-[160px] h-[160px] border border-white/[0.06]"
        />
      </div>

      {/* Main greeting */}
      <div className="relative z-10 px-14 w-full flex flex-col items-center text-center">
        <AnimatePresence mode="wait">
          <motion.h2
            key={mood.greeting}
            initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -30, filter: "blur(8px)" }}
            transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
            className="text-white/90 text-6xl xl:text-7xl tracking-tight leading-[0.95]"
            style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
          >
            {mood.greeting}
          </motion.h2>
        </AnimatePresence>

        {/* Subtle tagline */}
        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.33, 1, 0.68, 1] }}
            className="text-white/20 text-sm mt-6 max-w-[260px] mx-auto leading-relaxed"
          >
            {step === 0 && "Your journey to the perfect sublet starts with a few details."}
            {step === 1 && "Let\u2019s find the right city and term for your co-op."}
            {step === 2 && "Show roommates what makes you, you."}
            {step === 3 && "One photo and a few words. Then you\u2019re in."}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Decorative accent line */}
      <motion.div
        className="absolute bottom-[30%] left-14 h-px bg-gradient-to-r from-white/[0.08] to-transparent"
        animate={{ width: `${30 + step * 15}%` }}
        transition={{ duration: 1, ease: [0.33, 1, 0.68, 1] }}
      />
    </>
  );
}

// ————— Step 1: Basics —————
export function StepBasics({
  name,
  setName,
  email,
  setEmail,
  company,
  setCompany,
}: {
  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  company: string;
  setCompany: (v: string) => void;
}) {
  return (
    <motion.div variants={stagger} initial="enter" animate="center" className="space-y-5">
      <motion.div variants={staggerChild}>
        <FloatingInput label="Full name" value={name} onChange={setName} />
      </motion.div>

      <motion.div variants={staggerChild}>
        <FloatingInput
          label="School email"
          value={email}
          onChange={setEmail}
          type="email"
          hint="We'll verify your student status with this."
        />
      </motion.div>

      <motion.div variants={staggerChild}>
        <FloatingInput label="Company (Optional)" value={company} onChange={setCompany} />
      </motion.div>
    </motion.div>
  );
}

// ————— Step 2: Location —————
export function StepLocation({
  university,
  setUniversity,
  selectedCity,
  setSelectedCity,
  selectedTerm,
  setSelectedTerm,
  budget,
  setBudget,
}: {
  university: string;
  setUniversity: (v: string) => void;
  selectedCity: string;
  setSelectedCity: (v: string) => void;
  selectedTerm: string;
  setSelectedTerm: (v: string) => void;
  budget: number;
  setBudget: (v: number) => void;
}) {
  return (
    <motion.div variants={stagger} initial="enter" animate="center" className="space-y-5">
      <motion.div variants={staggerChild}>
        <FloatingInput label="University" value={university} onChange={setUniversity} />
      </motion.div>

      {/* City picker */}
      <motion.div variants={staggerChild}>
        <p className="text-sm font-medium text-muted mb-3">Co-op city</p>
        <div className="flex flex-wrap gap-2">
          {CITIES.map((city) => (
            <motion.button
              key={city}
              onClick={() => setSelectedCity(city)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.93 }}
              className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${selectedCity === city
                ? "bg-foreground text-surface shadow-[0_4px_15px_rgba(26,26,26,0.2)]"
                : "bg-warm-gray/10 text-foreground/70 hover:bg-warm-gray/20"
                }`}
            >
              {city}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Term picker */}
      <motion.div variants={staggerChild}>
        <p className="text-sm font-medium text-muted mb-3">Term</p>
        <div className="grid grid-cols-2 gap-2.5">
          {TERMS.map((term) => (
            <motion.button
              key={term}
              onClick={() => setSelectedTerm(term)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              className={`px-5 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${selectedTerm === term
                ? "bg-accent text-white shadow-[0_4px_20px_rgba(232,93,74,0.25)]"
                : "bg-warm-gray/10 text-foreground/70 hover:bg-warm-gray/20"
                }`}
            >
              {term}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Budget */}
      <motion.div variants={staggerChild}>
        <BudgetSlider budget={budget} setBudget={setBudget} />
      </motion.div>
    </motion.div>
  );
}

// ————— Step 3: Lifestyle —————
export function StepLifestyle({
  selectedLifestyles,
  toggleLifestyle,
}: {
  selectedLifestyles: string[];
  toggleLifestyle: (tag: string) => void;
}) {
  return (
    <motion.div variants={stagger} initial="enter" animate="center" className="space-y-4">
      <motion.div variants={staggerChild} className="flex flex-wrap gap-3">
        {LIFESTYLES.map(({ label, emoji }) => {
          const selected = selectedLifestyles.includes(label);
          return (
            <motion.button
              key={label}
              onClick={() => toggleLifestyle(label)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              layout
              className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 cursor-pointer ${selected
                ? "bg-foreground text-surface shadow-[0_4px_20px_rgba(26,26,26,0.15)]"
                : "bg-warm-gray/10 text-foreground/70 hover:bg-warm-gray/20"
                }`}
            >
              <span className="text-base">{emoji}</span>
              {label}
              <AnimatePresence>
                {selected && (
                  <motion.svg
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 16, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="h-4 overflow-hidden flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </motion.svg>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </motion.div>

      <AnimatePresence>
        {selectedLifestyles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 10, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-sage/[0.08] border border-sage/15 rounded-xl px-5 py-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-sage/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-sage">
                  {selectedLifestyles.length}
                </span>
              </div>
              <p className="text-sm text-foreground/70">
                {selectedLifestyles.length === 1
                  ? "1 tag selected"
                  : `${selectedLifestyles.length} tags selected`}{" "}
                &mdash; the more you pick, the better your matches.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ————— Step 4: Finish —————
export function StepFinish({
  avatar,
  setAvatar,
  bio,
  setBio,
}: {
  avatar: string | null;
  setAvatar: (v: string | null) => void;
  bio: string;
  setBio: (v: string) => void;
}) {
  return (
    <motion.div variants={stagger} initial="enter" animate="center" className="space-y-5">
      <motion.div variants={staggerChild}>
        <AvatarUpload avatar={avatar} setAvatar={setAvatar} />
      </motion.div>

      <motion.div variants={staggerChild}>
        <label className="text-sm font-medium text-muted mb-2 block">
          Short bio
        </label>
        <div className="relative">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell potential matches about yourself &#8212; your program, hobbies, what you're looking for..."
            rows={3}
            className="w-full px-5 py-4 rounded-xl bg-warm-gray/[0.06] border-2 border-warm-gray/20 text-foreground placeholder:text-muted/35 focus:outline-none focus:border-accent/40 focus:bg-transparent transition-all text-base resize-none leading-relaxed"
            style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
          />
          <div className="absolute bottom-3 right-4 text-[11px] text-muted/30">
            {bio.length}/300
          </div>
        </div>
      </motion.div>

      {/* Mobile-only preview */}
      <motion.div variants={staggerChild} className="lg:hidden">
        <div className="bg-foreground rounded-2xl p-5 text-surface relative overflow-hidden">
          <p className="text-accent text-[10px] font-semibold uppercase tracking-[0.2em] mb-3">
            Your profile preview
          </p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-white/10">
              {avatar ? (
                <img src={avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-accent to-orange-400 flex items-center justify-center font-serif text-sm text-white">
                  {bio || "?"}
                </div>
              )}
            </div>
            <div>
              <p className="text-surface text-sm font-semibold">Looking good!</p>
              <p className="text-surface/40 text-xs">See your full card on desktop.</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ————— Success Screen —————
export function SuccessScreen({ name }: { name: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface relative overflow-hidden">
      {/* Celebration effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-accent/[0.06] rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-1/3 right-1/3 w-[400px] h-[400px] bg-sage/[0.08] rounded-full blur-[120px] animate-pulse" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 text-center px-6"
      >
        {/* Checkmark circle */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-full bg-accent mx-auto mb-8 flex items-center justify-center shadow-[0_8px_40px_rgba(232,93,74,0.35)]"
        >
          <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <motion.path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.5, duration: 0.4, ease: "easeOut" }}
            />
          </svg>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="font-serif text-4xl md:text-5xl text-foreground tracking-tight mb-4"
        >
          Welcome aboard{name ? `, ${name.split(" ")[0]}` : ""}.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="text-muted text-lg max-w-md mx-auto mb-10 leading-relaxed"
          style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
        >
          Your profile is live. We&apos;ll start matching you with compatible listings and roommates.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-foreground text-surface font-semibold px-8 py-4 rounded-full hover:bg-foreground/90 transition-colors"
            style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
          >
            Start browsing
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
