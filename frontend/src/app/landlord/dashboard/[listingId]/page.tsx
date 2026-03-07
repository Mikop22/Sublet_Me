"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { use } from "react";
import { ArrowLeft, Pencil } from "lucide-react";
import {
  LISTINGS,
  STUDENT_MATCHES,
} from "@/lib/landlord-mock";
import { StudentMatchCard } from "@/components/landlord/StudentMatchCard";
import { RequirementsPanel } from "@/components/landlord/RequirementsPanel";
import { ChatPanel } from "@/components/landlord/ChatPanel";
import { TourModal } from "@/components/landlord/TourModal";
import { Reveal } from "@/components/landlord/Reveal";

const STATUS_STYLES = {
  active: "bg-sage/10 text-sage border-sage/20",
  paused: "bg-warm-gray/10 text-muted border-warm-gray/20",
  filled: "bg-accent/10 text-accent border-accent/20",
};

export default function ListingDetailPage({
  params,
}: {
  params: Promise<{ listingId: string }>;
}) {
  const { listingId } = use(params);
  const listing = LISTINGS.find((l) => l.id === Number(listingId));
  const matches = STUDENT_MATCHES[Number(listingId)] ?? [];

  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [tourStudentId, setTourStudentId] = useState<number | null>(null);
  const [pendingTourSlots, setPendingTourSlots] = useState<Record<number, string[]>>({});

  if (!listing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted">Listing not found.</p>
      </div>
    );
  }

  const activeStudent = matches.find((m) => m.id === activeChat) ?? null;
  const tourStudent = matches.find((m) => m.id === tourStudentId) ?? null;

  const handleConfirmTour = (studentId: number, slots: string[]) => {
    setPendingTourSlots((prev) => ({ ...prev, [studentId]: slots }));
    setActiveChat(studentId);
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
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 pt-8 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
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
              {listing.title}
            </h1>
            <span
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                STATUS_STYLES[listing.status]
              }`}
            >
              {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
            </span>
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-warm-gray/15 text-sm text-muted hover:bg-warm-gray/8 transition-colors">
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 pb-20 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 lg:gap-8">
        {/* Left — listing summary + requirements */}
        <div className="flex flex-col gap-4">
          {/* Listing thumbnail */}
          <div className="rounded-2xl overflow-hidden border border-warm-gray/10">
            <div className="h-[180px] overflow-hidden">
              <img
                src={listing.image}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              <p className="font-semibold text-foreground text-sm">{listing.title}</p>
              <p className="text-xs text-muted mt-0.5">{listing.address}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                <span>${listing.price}/mo</span>
                <span className="w-1 h-1 rounded-full bg-warm-gray/30" />
                <span>{listing.dates}</span>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <RequirementsPanel requirements={listing.requirements} />
        </div>

        {/* Right — matched students */}
        <div>
          <Reveal className="mb-5">
            <div className="flex items-baseline justify-between">
              <h2
                className="text-foreground text-xl tracking-tight"
                style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
              >
                {matches.length} students matched
              </h2>
              <span className="text-xs text-muted">Ranked by AI score</span>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.map((student, i) => (
              <Reveal key={student.id} delay={i * 0.06}>
                <StudentMatchCard
                  student={student}
                  listingRequirementTags={listing.requirements.lifestyleTags}
                  onMessage={() => setActiveChat(student.id)}
                  onScheduleTour={() => setTourStudentId(student.id)}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      {/* Chat panel — AnimatePresence wraps for exit animation */}
      <AnimatePresence>
        {activeStudent && (
          <>
            <motion.div
              key="chat-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/20"
              onClick={() => setActiveChat(null)}
            />
            <ChatPanel
              key="chat-panel"
              student={activeStudent}
              listingId={listing.id}
              onClose={() => setActiveChat(null)}
              onScheduleTour={() => {
                setTourStudentId(activeStudent.id);
              }}
              pendingTourSlots={activeStudent ? pendingTourSlots[activeStudent.id] : undefined}
            />
          </>
        )}
      </AnimatePresence>

      {/* Tour modal */}
      <AnimatePresence>
        {tourStudent && (
          <TourModal
            key="tour-modal"
            studentName={tourStudent.name}
            onClose={() => setTourStudentId(null)}
            onConfirm={(slots) => handleConfirmTour(tourStudent.id, slots)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
