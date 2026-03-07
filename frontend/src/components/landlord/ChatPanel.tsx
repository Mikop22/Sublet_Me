"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Paperclip, Calendar } from "lucide-react";
import type { StudentMatch, Message } from "@/lib/landlord-mock";
import { CONVERSATIONS } from "@/lib/landlord-mock";

function TourProposalBubble({
  slots,
  selectedSlot,
  onSelect,
}: {
  slots: string[];
  selectedSlot?: string;
  onSelect: (slot: string) => void;
}) {
  return (
    <div className="bg-accent/5 border border-accent/15 rounded-2xl p-4 max-w-[280px]">
      <p className="text-xs font-semibold text-accent mb-3">
        Virtual tour times — pick one:
      </p>
      <div className="flex flex-col gap-2">
        {slots.map((slot) => (
          <button
            key={slot}
            onClick={() => onSelect(slot)}
            className={`text-xs text-left px-3 py-2 rounded-lg border transition-colors ${
              selectedSlot === slot
                ? "bg-accent text-white border-accent"
                : "border-warm-gray/20 text-foreground hover:border-accent/30 hover:bg-accent/5"
            }`}
          >
            {slot}
          </button>
        ))}
      </div>
    </div>
  );
}

function TourConfirmedBanner({ slot, meetLink }: { slot: string; meetLink: string }) {
  return (
    <div className="bg-sage/5 border border-sage/20 rounded-xl px-4 py-3 flex items-center justify-between mx-4 mb-3">
      <div>
        <p className="text-xs font-semibold text-foreground">Virtual Tour Scheduled</p>
        <p className="text-[11px] text-muted mt-0.5">{slot}</p>
      </div>
      <a
        href={meetLink}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[11px] font-semibold text-accent hover:underline flex-shrink-0"
      >
        Join Meet →
      </a>
    </div>
  );
}

export function ChatPanel({
  student,
  listingId,
  onClose,
  onScheduleTour,
  pendingTourSlots,
}: {
  student: StudentMatch;
  listingId: number;
  onClose: () => void;
  onScheduleTour: () => void;
  pendingTourSlots?: string[];
}) {
  const conversationKey = `${listingId}-${student.id}`;
  const [messages, setMessages] = useState<Message[]>(() => {
    const existingMessages = CONVERSATIONS[conversationKey] ?? [];
    const tourProposal: Message[] =
      pendingTourSlots && pendingTourSlots.length > 0
        ? [
            {
              id: Date.now(),
              senderId: "landlord" as const,
              text: "I'm available at these times — pick one that works!",
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              type: "tour-proposal" as const,
              tourSlots: pendingTourSlots,
            },
          ]
        : [];
    return [...existingMessages, ...tourProposal];
  });
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        senderId: "landlord",
        text: input.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        type: "text",
      },
    ]);
    setInput("");
  };

  const confirmedTour = messages.find(
    (m) => m.type === "tour-confirmed" && m.selectedSlot
  );

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ duration: 0.35, ease: [0.33, 1, 0.68, 1] }}
      className="fixed top-0 right-0 h-full w-full max-w-[400px] bg-background border-l border-warm-gray/10 z-50 flex flex-col shadow-2xl"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-warm-gray/10 flex items-center gap-3 flex-shrink-0">
        <img
          src={student.avatar}
          alt={student.name}
          className="w-10 h-10 rounded-full object-cover ring-2 ring-warm-gray/10"
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm truncate">
            {student.name}
          </p>
          <p className="text-[11px] text-muted">
            {student.university} · {student.match}% match
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-warm-gray/8 flex items-center justify-center hover:bg-warm-gray/15 transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4 text-foreground/60" />
        </button>
      </div>

      {/* Tour confirmed banner */}
      {confirmedTour && confirmedTour.selectedSlot && confirmedTour.meetLink && (
        <TourConfirmedBanner
          slot={confirmedTour.selectedSlot}
          meetLink={confirmedTour.meetLink}
        />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <p className="text-center text-xs text-muted/60 mt-8">
            Start the conversation with {student.name.split(" ")[0]}.
          </p>
        )}
        {messages.map((msg) => {
          const isLandlord = msg.senderId === "landlord";

          if (msg.type === "tour-proposal" && msg.tourSlots) {
            return (
              <div key={msg.id} className={`flex ${isLandlord ? "justify-end" : "justify-start"}`}>
                <TourProposalBubble
                  slots={msg.tourSlots}
                  selectedSlot={msg.selectedSlot}
                  onSelect={(slot) => {
                    const meetLink = "https://meet.google.com/mock-link-abc";
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === msg.id ? { ...m, selectedSlot: slot } : m
                      ).concat({
                        id: Date.now(),
                        senderId: "landlord",
                        text: `Tour confirmed for ${slot}`,
                        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                        type: "tour-confirmed",
                        selectedSlot: slot,
                        meetLink,
                      })
                    );
                  }}
                />
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex flex-col gap-1 ${isLandlord ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isLandlord
                    ? "bg-foreground text-background rounded-br-sm"
                    : "bg-surface border border-warm-gray/10 text-foreground rounded-bl-sm"
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-muted/50">{msg.timestamp}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-4 border-t border-warm-gray/10 flex-shrink-0">
        <div className="flex items-center gap-2 bg-surface border border-warm-gray/10 rounded-2xl px-3 py-2">
          <button className="text-muted/50 hover:text-muted transition-colors flex-shrink-0">
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Message..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted/50 outline-none"
          />
          <button
            onClick={onScheduleTour}
            className="text-muted/50 hover:text-accent transition-colors flex-shrink-0"
            title="Propose a tour"
          >
            <Calendar className="w-4 h-4" />
          </button>
          <button
            onClick={send}
            disabled={!input.trim()}
            className="flex-shrink-0 w-7 h-7 rounded-full bg-accent flex items-center justify-center disabled:opacity-30 transition-opacity"
          >
            <svg
              className="w-3.5 h-3.5 text-white rotate-90"
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
