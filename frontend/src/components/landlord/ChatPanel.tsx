"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Paperclip, X } from "lucide-react";

import { formatTourSlot } from "@/lib/landlord-detail";
import type { LandlordMatch } from "@/lib/landlord-types";

function TourProposalBubble({
  slots,
  selectedSlot,
  disabled,
  onSelect,
}: {
  slots: string[];
  selectedSlot?: string;
  disabled?: boolean;
  onSelect: (slot: string) => void;
}) {
  return (
    <div className="max-w-[280px] rounded-2xl border border-accent/15 bg-accent/5 p-4">
      <p className="mb-3 text-xs font-semibold text-accent">
        Virtual tour times. Pick one:
      </p>
      <div className="flex flex-col gap-2">
        {slots.map((slot) => (
          <button
            key={slot}
            onClick={() => onSelect(slot)}
            disabled={disabled}
            className={`cursor-pointer rounded-lg border px-3 py-2 text-left text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              selectedSlot === slot
                ? "border-accent bg-accent text-white"
                : "border-warm-gray/20 text-foreground hover:border-accent/30 hover:bg-accent/5"
            }`}
          >
            {formatTourSlot(slot)}
          </button>
        ))}
      </div>
    </div>
  );
}

function TourConfirmedBanner({
  slot,
  meetLink,
}: {
  slot: string;
  meetLink: string;
}) {
  return (
    <div className="mx-4 mb-3 flex items-center justify-between rounded-xl border border-sage/20 bg-sage/5 px-4 py-3">
      <div>
        <p className="text-xs font-semibold text-foreground">Virtual Tour Scheduled</p>
        <p className="mt-0.5 text-[11px] text-muted">{formatTourSlot(slot)}</p>
      </div>
      <a
        href={meetLink}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0 text-[11px] font-semibold text-accent hover:underline"
      >
        Join Meet →
      </a>
    </div>
  );
}

export function ChatPanel({
  student,
  onClose,
  onScheduleTour,
  onSendMessage,
  onConfirmTourSlot,
  sendingMessage = false,
  updatingTour = false,
  errorMessage,
}: {
  student: LandlordMatch;
  onClose: () => void;
  onScheduleTour: () => void;
  onSendMessage: (text: string) => Promise<void>;
  onConfirmTourSlot: (slot: string) => Promise<void>;
  sendingMessage?: boolean;
  updatingTour?: boolean;
  errorMessage?: string | null;
}) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const conversationReady = Boolean(student.conversationId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [student.messages]);

  const send = async () => {
    const message = input.trim();
    if (!message || !conversationReady || sendingMessage) {
      return;
    }

    try {
      await onSendMessage(message);
      setInput("");
    } catch {
      // The parent owns the error state and surfaces it in the panel.
    }
  };

  const confirmedTour =
    student.tour?.status === "confirmed" &&
    student.tour.selectedSlot &&
    student.tour.meetLink
      ? {
          slot: student.tour.selectedSlot,
          meetLink: student.tour.meetLink,
        }
      : null;

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ duration: 0.35, ease: [0.33, 1, 0.68, 1] }}
      className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[400px] flex-col border-l border-warm-gray/10 bg-background shadow-2xl"
    >
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-warm-gray/10 px-5 py-4">
        <img
          src={student.avatar}
          alt={student.name}
          className="h-10 w-10 rounded-full object-cover ring-2 ring-warm-gray/10"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{student.name}</p>
          <p className="text-[11px] text-muted">
            {student.university} · {student.match}% match
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-warm-gray/8 transition-colors hover:bg-warm-gray/15"
        >
          <X className="h-4 w-4 text-foreground/60" />
        </button>
      </div>

      {confirmedTour && (
        <TourConfirmedBanner
          slot={confirmedTour.slot}
          meetLink={confirmedTour.meetLink}
        />
      )}

      {errorMessage && (
        <div className="mx-4 mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        {student.messages.length === 0 && (
          <p className="mt-8 text-center text-xs text-muted/60">
            Start the conversation with {student.name.split(" ")[0]}.
          </p>
        )}
        {student.messages.map((message) => {
          const isLandlord = message.sender === "host";

          if (message.type === "tour-proposal" && message.tourSlots?.length) {
            return (
              <div
                key={message.id}
                className={`flex ${isLandlord ? "justify-end" : "justify-start"}`}
              >
                <TourProposalBubble
                  slots={message.tourSlots}
                  selectedSlot={student.tour?.selectedSlot}
                  disabled={Boolean(student.tour?.selectedSlot) || updatingTour}
                  onSelect={(slot) => {
                    void onConfirmTourSlot(slot);
                  }}
                />
              </div>
            );
          }

          return (
            <div
              key={message.id}
              className={`flex flex-col gap-1 ${isLandlord ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  isLandlord
                    ? "rounded-br-sm bg-foreground text-background"
                    : "rounded-bl-sm border border-warm-gray/10 bg-surface text-foreground"
                }`}
              >
                {message.text}
              </div>
              <span className="text-[10px] text-muted/50">{message.timestamp}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex-shrink-0 border-t border-warm-gray/10 px-4 py-4">
        {!conversationReady && (
          <p className="mb-3 text-xs text-muted">
            This match does not have a seeded conversation yet.
          </p>
        )}
        <div className="flex items-center gap-2 rounded-2xl border border-warm-gray/10 bg-surface px-3 py-2">
          <button className="cursor-pointer text-muted/50 transition-colors hover:text-muted">
            <Paperclip className="h-4 w-4" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void send();
              }
            }}
            disabled={!conversationReady || sendingMessage}
            placeholder={conversationReady ? "Message..." : "Conversation unavailable"}
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted/50 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            onClick={onScheduleTour}
            disabled={!conversationReady || updatingTour}
            className="cursor-pointer text-muted/50 transition-colors hover:text-accent disabled:cursor-not-allowed disabled:opacity-30"
            title="Propose a tour"
          >
            <Calendar className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              void send();
            }}
            disabled={!conversationReady || !input.trim() || sendingMessage}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-accent transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg
              className="h-3.5 w-3.5 rotate-90 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 19V5m0 0l-7 7m7-7l7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
