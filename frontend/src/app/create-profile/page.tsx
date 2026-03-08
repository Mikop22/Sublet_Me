"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import MagneticButton from "@/components/MagneticButton";

// ————— Data —————
const CITIES = [
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
const TERMS = ["Summer 2025", "Fall 2025", "Winter 2026", "Summer 2026"];
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

const STEPS = [
  {
    title: "Let\u2019s start with\nthe basics",
    subtitle: "Tell us who you are and what you\u2019re looking for.",
  },
  {
    title: "Where are you\nheaded?",
    subtitle: "Help us narrow down listings that match your co-op.",
  },
  {
    title: "What\u2019s your\nvibe?",
    subtitle: "Pick tags that describe your living style.",
  },
  {
    title: "One last\nthing",
    subtitle: "Add a photo and bio to complete your profile.",
  },
];

// ————— Animations —————
const stepVariants = {
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

const stagger = {
  center: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const staggerChild = {
  enter: { y: 20, opacity: 0 },
  center: { y: 0, opacity: 1, transition: { duration: 0.45, ease: [0.33, 1, 0.68, 1] as const } },
};

// ————— Floating Input —————
function FloatingInput({
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
function AvatarUpload({
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
function BudgetSlider({
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
  { greeting: "Hello.", accent: "#E85D4A", secondary: "#F4A261", tagline: "Your journey to the perfect sublet starts with a few details." },
  { greeting: "Where to?", accent: "#A8B5A0", secondary: "#E85D4A", tagline: "Let's find the right city and term for your co-op." },
  { greeting: "Be yourself.", accent: "#F4A261", secondary: "#A8B5A0", tagline: "Show roommates what makes you, you." },
  { greeting: "Almost there.", accent: "#E85D4A", secondary: "#A8B5A0", tagline: "One photo and a few words. Then you're in." },
];

const PANEL_MOODS_HOST = [
  { greeting: "Hello.", accent: "#E85D4A", secondary: "#F4A261", tagline: "Let's get your listing ready for students." },
  { greeting: "Almost there.", accent: "#E85D4A", secondary: "#A8B5A0", tagline: "One photo and a few words. Then you're in." },
];

function AmbientPanel({ step, isHost }: { step: number; isHost: boolean }) {
  const moods = isHost ? PANEL_MOODS_HOST : PANEL_MOODS;
  const mood = moods[step] || moods[0];

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
            {mood.tagline}
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
function StepBasics({
  name,
  setName,
  email,
  setEmail,
  userType,
  setUserType,
  company,
  setCompany,
}: {
  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  userType: string;
  setUserType: (v: "tenant" | "host") => void;
  company: string;
  setCompany: (v: string) => void;
}) {
  return (
    <motion.div variants={stagger} initial="enter" animate="center" className="space-y-5">
      {/* Role selector */}
      <motion.div variants={staggerChild}>
        <p className="text-sm font-medium text-muted mb-3">I want to...</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              value: "tenant" as const,
              label: "Find a place",
              desc: "I need a sublet",
              icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              ),
            },
            {
              value: "host" as const,
              label: "List my place",
              desc: "I have a sublet",
              icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
                </svg>
              ),
            },
          ].map((opt) => (
            <motion.button
              key={opt.value}
              onClick={() => setUserType(opt.value)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className={`relative p-5 rounded-2xl border-2 transition-all duration-300 text-left cursor-pointer group ${userType === opt.value
                ? "border-accent bg-accent/[0.03] shadow-[0_0_0_1px_rgba(232,93,74,0.08)]"
                : "border-warm-gray/25 hover:border-warm-gray/50"
                }`}
            >
              <div
                className={`mb-3 transition-colors ${userType === opt.value ? "text-accent" : "text-muted/50"
                  }`}
              >
                {opt.icon}
              </div>
              <p className="font-semibold text-foreground text-sm">{opt.label}</p>
              <p className="text-xs text-muted/60 mt-0.5">{opt.desc}</p>
              {/* Selected indicator */}
              <AnimatePresence>
                {userType === opt.value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute top-3 right-3 w-5 h-5 rounded-full bg-accent flex items-center justify-center"
                  >
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>
      </motion.div>

      <motion.div variants={staggerChild}>
        <FloatingInput label="Full name" value={name} onChange={setName} />
      </motion.div>

      <motion.div variants={staggerChild}>
        <FloatingInput
          label={userType === "host" ? "Email" : "School email"}
          value={email}
          onChange={setEmail}
          type="email"
          hint={userType !== "host" ? "We'll verify your student status with this." : undefined}
        />
      </motion.div>

      <AnimatePresence initial={false} mode="wait">
        {userType !== "host" && (
          <motion.div
            key="company-field"
            initial={{ height: 0, opacity: 0, marginTop: 0, scale: 0.95 }}
            animate={{ 
              height: "auto", 
              opacity: 1, 
              marginTop: "1.25rem",
              scale: 1,
              transition: { 
                height: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
                opacity: { duration: 0.3, ease: [0.33, 1, 0.68, 1], delay: 0.1 },
                marginTop: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
                scale: { duration: 0.3, ease: [0.33, 1, 0.68, 1], delay: 0.1 }
              }
            }}
            exit={{ 
              height: 0, 
              opacity: 0, 
              marginTop: 0,
              scale: 0.95,
              transition: { 
                height: { duration: 0.3, ease: [0.33, 1, 0.68, 1] },
                opacity: { duration: 0.2, ease: [0.33, 1, 0.68, 1] },
                marginTop: { duration: 0.3, ease: [0.33, 1, 0.68, 1] },
                scale: { duration: 0.2, ease: [0.33, 1, 0.68, 1] }
              }
            }}
            className="overflow-hidden"
          >
            <FloatingInput label="Company (Optional)" value={company} onChange={setCompany} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ————— Step 2: Location —————
function StepLocation({
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
function StepLifestyle({
  selectedLifestyles,
  toggleLifestyle,
}: {
  selectedLifestyles: string[];
  toggleLifestyle: (tag: string) => void;
}) {
  return (
    <motion.div variants={stagger} initial="enter" animate="center" className="space-y-4 w-full pb-4">
      <motion.div variants={staggerChild} className="flex flex-wrap gap-3 w-full">
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
function StepFinish({
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
function SuccessScreen({ name, userType }: { name: string; userType: "tenant" | "host" | "" }) {
  const dashboardPath = userType === "host" ? "/landlord/dashboard" : "/dashboard";
  
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
            href={dashboardPath}
            className="inline-flex items-center gap-2 bg-foreground text-surface font-semibold px-8 py-4 rounded-full hover:bg-foreground/90 transition-colors cursor-pointer"
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

// ————— Main Page —————
export default function CreateProfilePage() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [university, setUniversity] = useState("");
  const [userType, setUserType] = useState<"tenant" | "host" | "">("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [budget, setBudget] = useState(900);
  const [selectedLifestyles, setSelectedLifestyles] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);

  // Dynamic steps based on userType
  const getSteps = () => {
    if (userType === "host") {
      return [
        STEPS[0], // Basics
        STEPS[3], // Finish
      ];
    }
    return STEPS; // All 4 steps for tenants
  };

  const activeSteps = getSteps();
  const totalSteps = activeSteps.length;

  const goNext = () => {
    if (step < totalSteps - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  };

  const goBack = () => {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };

  const toggleLifestyle = (tag: string) => {
    setSelectedLifestyles((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      await fetch("/api/subletops/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: {
            name,
            user_type: userType,
            city: selectedCity,
            term: selectedTerm,
            budget,
            university,
            company,
            lifestyle_tags: selectedLifestyles,
            roommate_vibe: selectedLifestyles[0] ?? null,
            bio,
          },
        }),
      });
    } catch {
      // Graceful fallback: keep onboarding UX unblocked during backend issues.
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setIsComplete(true);
    }, 1000);
  };

  // Validation function to check if current step is complete
  const isStepValid = () => {
    if (userType === "host") {
      // Hosts: step 0 = Basics, step 1 = Finish
      if (step === 0) {
        return name.trim().length > 0 && email.trim().length > 0;
      }
      return true; // Finish step - bio and avatar are optional
    }
    
    // Tenants: 4 steps
    switch (step) {
      case 0: // Basics
        return name.trim().length > 0 && email.trim().length > 0 && userType !== "";
      case 1: // Location
        return university.trim().length > 0 && selectedCity !== "" && selectedTerm !== "";
      case 2: // Lifestyle
        return selectedLifestyles.length > 0; // At least one lifestyle tag selected
      case 3: // Finish
        return true; // Bio and avatar are optional
      default:
        return false;
    }
  };

  if (isComplete) {
    return <SuccessScreen name={name} userType={userType} />;
  }

  return (
    <div
      className="h-screen flex flex-col lg:flex-row overflow-hidden"
      style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
    >
      {/* ————— Left Panel: Ambient Canvas ————— */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#0F0E0D] relative flex-col justify-between overflow-hidden py-8">
        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none">
          <svg width="100%" height="100%">
            <defs>
              <filter id="noise-panel">
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.8"
                  numOctaves="4"
                  stitchTiles="stitch"
                />
              </filter>
            </defs>
            <rect width="100%" height="100%" filter="url(#noise-panel)" />
          </svg>
        </div>

        {/* Branding - top */}
        <div className="relative z-10 px-14">
          <Link
            href="/"
            className="text-white/30 text-xs tracking-[0.25em] uppercase font-semibold hover:text-white/60 transition-colors cursor-pointer"
            style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
          >
            Sublet-<span className="text-accent">Me</span>
          </Link>
        </div>

        {/* Ambient content - middle */}
        <div className="flex-1 flex items-center">
          <AmbientPanel step={step} isHost={userType === "host"} />
        </div>

      </div>

      {/* ————— Right Panel: Form ————— */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-surface">
        {/* Top bar */}
        <header className="flex items-center justify-between px-8 md:px-12 py-5 flex-shrink-0">
          <Link
            href="/"
            className="lg:hidden font-serif text-xl text-foreground tracking-tight"
            style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
          >
            Sublet-<span className="text-accent">Me</span>
          </Link>
          <Link
            href="/"
            className="text-muted/50 hover:text-foreground transition-colors ml-auto p-2 rounded-full hover:bg-warm-gray/10 cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Link>
        </header>

        {/* Progress segments (mobile only, desktop has the bottom left counter) */}
        <div className="px-8 md:px-12 flex-shrink-0 lg:hidden">
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className="flex-1 h-[3px] rounded-full overflow-hidden bg-warm-gray/12"
              >
                <motion.div
                  className="h-full rounded-full bg-accent"
                  animate={{
                    width: i < step ? "100%" : i === step ? "40%" : "0%",
                  }}
                  transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Form content */}
        <div className="flex-1 flex flex-col px-[6%] xl:px-[8%] py-6 w-full min-h-0">
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
                className="flex flex-col flex-1 min-h-0 overflow-hidden"
              >
              {/* Step header */}
              <div className="mb-6 flex-shrink-0">
                <h1
                  className="font-serif text-[clamp(1.75rem,3vw,2.75rem)] tracking-tight text-foreground leading-[1.05] whitespace-pre-line"
                  style={{
                    fontFamily: "var(--font-dm-serif), Georgia, serif",
                  }}
                >
                  {activeSteps[step].title}
                </h1>
                <p className="text-muted text-sm mt-2 leading-relaxed">
                  {activeSteps[step].subtitle}
                </p>
              </div>

                {/* Step body */}
                <div className="flex-1 min-h-0 overflow-y-auto pb-4">
                {userType === "host" ? (
                  // Host flow: 2 steps (Basics, Finish)
                  step === 0 ? (
                    <StepBasics
                      name={name}
                      setName={setName}
                      email={email}
                      setEmail={setEmail}
                      userType={userType}
                      setUserType={setUserType}
                      company={company}
                      setCompany={setCompany}
                    />
                  ) : (
                    <StepFinish
                      avatar={avatar}
                      setAvatar={setAvatar}
                      bio={bio}
                      setBio={setBio}
                    />
                  )
                ) : (
                  // Tenant flow: 4 steps (Basics, Location, Lifestyle, Finish)
                  <>
                    {step === 0 && (
                      <StepBasics
                        name={name}
                        setName={setName}
                        email={email}
                        setEmail={setEmail}
                        userType={userType}
                        setUserType={setUserType}
                        company={company}
                        setCompany={setCompany}
                      />
                    )}
                    {step === 1 && (
                      <StepLocation
                        university={university}
                        setUniversity={setUniversity}
                        selectedCity={selectedCity}
                        setSelectedCity={setSelectedCity}
                        selectedTerm={selectedTerm}
                        setSelectedTerm={setSelectedTerm}
                        budget={budget}
                        setBudget={setBudget}
                      />
                    )}
                    {step === 2 && (
                      <StepLifestyle
                        selectedLifestyles={selectedLifestyles}
                        toggleLifestyle={toggleLifestyle}
                      />
                    )}
                    {step === 3 && (
                      <StepFinish
                        avatar={avatar}
                        setAvatar={setAvatar}
                        bio={bio}
                        setBio={setBio}
                      />
                    )}
                  </>
                )}
              </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-5 border-t border-warm-gray/10 flex-shrink-0">
            <button
              onClick={goBack}
              className={`text-sm font-medium text-muted hover:text-foreground transition-colors cursor-pointer flex items-center gap-2 group ${step === 0 ? "invisible" : ""
                }`}
            >
              <svg
                className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>

            {isSubmitting ? (
              <motion.button
                disabled
                className="relative font-semibold rounded-full text-base cursor-not-allowed overflow-hidden min-w-[170px] bg-accent text-white px-8 py-4 shadow-[0_8px_30px_rgba(232,93,74,0.25)] opacity-60"
              >
                <motion.div className="flex items-center justify-center gap-2.5">
                  <motion.div
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 0.7,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  Creating...
                </motion.div>
              </motion.button>
            ) : (
              <MagneticButton
                onClick={() => {
                  if (!isStepValid()) return;
                  if (step === totalSteps - 1) {
                    void handleSubmit();
                    return;
                  }
                  goNext();
                }}
                className={`font-semibold rounded-full text-base min-w-[170px] transition-all duration-300 ${
                  !isStepValid() ? "opacity-60 cursor-not-allowed pointer-events-none" : "cursor-pointer"
                } ${
                  step === totalSteps - 1
                    ? "bg-accent text-white px-8 py-4 shadow-[0_8px_30px_rgba(232,93,74,0.25)] hover:shadow-[0_12px_40px_rgba(232,93,74,0.35)]"
                    : "bg-foreground text-surface px-8 py-4 hover:bg-foreground/90"
                }`}
              >
                {step === totalSteps - 1 ? "Create profile" : "Continue"}
              </MagneticButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
