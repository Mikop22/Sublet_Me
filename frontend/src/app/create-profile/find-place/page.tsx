"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  stepVariants,
  stagger,
  StepBasics,
  StepLocation,
  StepLifestyle,
  StepFinish,
  AmbientPanel,
  SuccessScreen,
  CITIES,
  TERMS,
  LIFESTYLES,
} from "../shared-components";

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

export default function FindPlacePage() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [university, setUniversity] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [budget, setBudget] = useState(900);
  const [selectedLifestyles, setSelectedLifestyles] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);

  const totalSteps = 4;
  const userType = "tenant"; // Pre-set for find place flow

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

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsComplete(true);
    }, 2000);
  };

  if (isComplete) {
    return <SuccessScreen name={name} />;
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
            className="text-white/30 text-xs tracking-[0.25em] uppercase font-semibold hover:text-white/60 transition-colors"
            style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
          >
            Sublet-Me
          </Link>
        </div>

        {/* Ambient content - middle */}
        <div className="flex-1 flex items-center">
          <AmbientPanel step={step} />
        </div>

        {/* Bottom step counter */}
        <div className="relative z-10 px-14">
          <div className="flex items-center gap-3 text-white/20 text-xs">
            <motion.span
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-accent font-mono font-semibold text-sm"
            >
              {String(step + 1).padStart(2, "0")}
            </motion.span>
            <div className="flex-1 h-px bg-white/[0.05] relative overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-white/[0.1]"
                animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
                transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
              />
            </div>
            <span className="font-mono text-white/15">
              {String(totalSteps).padStart(2, "0")}
            </span>
          </div>
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
            Sublet-Me
          </Link>
          <Link
            href="/"
            className="text-muted/50 hover:text-foreground transition-colors ml-auto p-2 rounded-full hover:bg-warm-gray/10"
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
        <div className="flex-1 flex flex-col px-[6%] xl:px-[8%] py-6 w-full overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
              className="flex-1 flex flex-col justify-center"
            >
              {/* Step header */}
              <div className="mb-6">
                <h1
                  className="font-serif text-[clamp(1.75rem,3vw,2.75rem)] tracking-tight text-foreground leading-[1.05] whitespace-pre-line"
                  style={{
                    fontFamily: "var(--font-dm-serif), Georgia, serif",
                  }}
                >
                  {STEPS[step].title}
                </h1>
                <p className="text-muted text-sm mt-2 leading-relaxed">
                  {STEPS[step].subtitle}
                </p>
              </div>

              {/* Step body */}
              <div className="overflow-hidden">
                {step === 0 && (
                  <StepBasics
                    name={name}
                    setName={setName}
                    email={email}
                    setEmail={setEmail}
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
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-auto pt-5 border-t border-warm-gray/10 flex-shrink-0">
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

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={step === totalSteps - 1 ? handleSubmit : goNext}
              disabled={isSubmitting}
              className={`relative font-semibold rounded-full text-base cursor-pointer overflow-hidden min-w-[170px] transition-all duration-300 ${step === totalSteps - 1
                ? "bg-accent text-white px-8 py-4 shadow-[0_8px_30px_rgba(232,93,74,0.25)] hover:shadow-[0_12px_40px_rgba(232,93,74,0.35)]"
                : "bg-foreground text-surface px-8 py-4 hover:bg-foreground/90"
                } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              <AnimatePresence mode="wait">
                {isSubmitting ? (
                  <motion.div
                    key="spin"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center justify-center gap-2.5"
                  >
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
                ) : (
                  <motion.span
                    key="label"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center justify-center gap-2"
                  >
                    {step === totalSteps - 1 ? "Create profile" : "Continue"}
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
