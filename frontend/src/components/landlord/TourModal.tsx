"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

const TIMES = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM",
  "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM",
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM",
  "4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM",
];

type Slot = { date: string; time: string };

export function TourModal({
  studentName,
  onClose,
  onConfirm,
}: {
  studentName: string;
  onClose: () => void;
  onConfirm: (slots: string[]) => void;
}) {
  const [slots, setSlots] = useState<Slot[]>([
    { date: "", time: "" },
    { date: "", time: "" },
    { date: "", time: "" },
  ]);
  const [step, setStep] = useState<"pick" | "confirm">("pick");

  const updateSlot = (i: number, field: keyof Slot, value: string) => {
    setSlots((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  };

  const validSlots = slots
    .filter((s) => s.date && s.time)
    .map((s) => `${s.date} at ${s.time}`);

  const canProceed = validSlots.length >= 1;

  return (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: [0.33, 1, 0.68, 1] }}
          className="bg-background rounded-3xl p-6 w-full max-w-md shadow-2xl border border-warm-gray/10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3
                className="text-foreground text-lg tracking-tight"
                style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
              >
                {step === "pick" ? "Propose tour times" : "Confirm proposal"}
              </h3>
              <p className="text-xs text-muted mt-0.5">
                {step === "pick"
                  ? `Pick up to 3 times for ${studentName.split(" ")[0]}`
                  : `These will be sent to ${studentName.split(" ")[0]}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-warm-gray/8 flex items-center justify-center hover:bg-warm-gray/15 transition-colors"
            >
              <X className="w-4 h-4 text-foreground/60" />
            </button>
          </div>

          {step === "pick" ? (
            <div className="flex flex-col gap-3">
              {slots.map((slot, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="date"
                    value={slot.date}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => updateSlot(i, "date", e.target.value)}
                    className="flex-1 bg-surface border border-warm-gray/10 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent/30 transition-colors"
                  />
                  <select
                    value={slot.time}
                    onChange={(e) => updateSlot(i, "time", e.target.value)}
                    className="flex-1 bg-surface border border-warm-gray/10 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent/30 transition-colors"
                  >
                    <option value="">Time</option>
                    {TIMES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              ))}

              <button
                onClick={() => setStep("confirm")}
                disabled={!canProceed}
                className="mt-2 w-full py-3 rounded-2xl bg-accent text-white text-sm font-semibold disabled:opacity-30 hover:bg-accent/90 transition-colors"
              >
                Continue
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {validSlots.map((slot, i) => (
                <div
                  key={i}
                  className="px-4 py-3 rounded-xl bg-surface border border-warm-gray/10 text-sm text-foreground"
                >
                  {slot}
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setStep("pick")}
                  className="flex-1 py-3 rounded-2xl border border-warm-gray/15 text-sm font-semibold text-muted hover:bg-warm-gray/8 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    onConfirm(validSlots);
                    onClose();
                  }}
                  className="flex-1 py-3 rounded-2xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors"
                >
                  Send to student
                </button>
              </div>
            </div>
          )}
        </motion.div>
    </motion.div>
  );
}
