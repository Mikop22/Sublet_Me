"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

const TIMES = [
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
  "4:30 PM",
  "5:00 PM",
  "5:30 PM",
  "6:00 PM",
];

type Slot = {
  date: string;
  time: string;
};

function parseTimeLabel(time: string): { hours: number; minutes: number } | null {
  const match = time.match(/^(\d{1,2}):(\d{2})\s(AM|PM)$/);
  if (!match) {
    return null;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3];

  if (meridiem === "PM" && hours !== 12) {
    hours += 12;
  }

  if (meridiem === "AM" && hours === 12) {
    hours = 0;
  }

  return { hours, minutes };
}

function toIsoSlot(slot: Slot): string | null {
  if (!slot.date || !slot.time) {
    return null;
  }

  const parsedTime = parseTimeLabel(slot.time);
  if (!parsedTime) {
    return null;
  }

  const nextSlot = new Date(`${slot.date}T00:00:00`);
  nextSlot.setHours(parsedTime.hours, parsedTime.minutes, 0, 0);

  return nextSlot.toISOString();
}

function formatSlotPreview(slot: Slot): string {
  return `${slot.date} at ${slot.time}`;
}

export function TourModal({
  studentName,
  onClose,
  onConfirm,
  isSubmitting = false,
  errorMessage,
}: {
  studentName: string;
  onClose: () => void;
  onConfirm: (slots: string[]) => Promise<void>;
  isSubmitting?: boolean;
  errorMessage?: string | null;
}) {
  const [slots, setSlots] = useState<Slot[]>([
    { date: "", time: "" },
    { date: "", time: "" },
    { date: "", time: "" },
  ]);
  const [step, setStep] = useState<"pick" | "confirm">("pick");

  const previewSlots = useMemo(
    () => slots.filter((slot) => slot.date && slot.time).map(formatSlotPreview),
    [slots]
  );
  const validSlots = useMemo(
    () => slots.map(toIsoSlot).filter((slot): slot is string => Boolean(slot)),
    [slots]
  );

  const canProceed = validSlots.length >= 1;

  const updateSlot = (index: number, field: keyof Slot, value: string) => {
    setSlots((currentSlots) =>
      currentSlots.map((slot, currentIndex) =>
        currentIndex === index ? { ...slot, [field]: value } : slot
      )
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25, ease: [0.33, 1, 0.68, 1] }}
        className="w-full max-w-md rounded-3xl border border-warm-gray/10 bg-background p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3
              className="text-lg tracking-tight text-foreground"
              style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
            >
              {step === "pick" ? "Propose tour times" : "Confirm proposal"}
            </h3>
            <p className="mt-0.5 text-xs text-muted">
              {step === "pick"
                ? `Pick up to 3 times for ${studentName.split(" ")[0]}`
                : `These will be sent to ${studentName.split(" ")[0]}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-warm-gray/8 transition-colors hover:bg-warm-gray/15"
          >
            <X className="h-4 w-4 text-foreground/60" />
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
            {errorMessage}
          </div>
        )}

        {step === "pick" ? (
          <div className="flex flex-col gap-3">
            {slots.map((slot, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="date"
                  value={slot.date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(event) => updateSlot(index, "date", event.target.value)}
                  className="flex-1 rounded-xl border border-warm-gray/10 bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent/30"
                />
                <select
                  value={slot.time}
                  onChange={(event) => updateSlot(index, "time", event.target.value)}
                  className="flex-1 rounded-xl border border-warm-gray/10 bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent/30"
                >
                  <option value="">Time</option>
                  {TIMES.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            <button
              onClick={() => setStep("confirm")}
              disabled={!canProceed}
              className="mt-2 w-full rounded-2xl bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-30"
            >
              Continue
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {previewSlots.map((slot, index) => (
              <div
                key={index}
                className="rounded-xl border border-warm-gray/10 bg-surface px-4 py-3 text-sm text-foreground"
              >
                {slot}
              </div>
            ))}
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => setStep("pick")}
                disabled={isSubmitting}
                className="flex-1 rounded-2xl border border-warm-gray/15 py-3 text-sm font-semibold text-muted transition-colors hover:bg-warm-gray/8 disabled:opacity-40"
              >
                Back
              </button>
              <button
                onClick={() => {
                  void onConfirm(validSlots);
                }}
                disabled={!canProceed || isSubmitting}
                className="flex-1 rounded-2xl bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-40"
              >
                {isSubmitting ? "Sending..." : "Send to student"}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
