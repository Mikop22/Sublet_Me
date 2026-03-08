"use client";

import { use, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { ChatPanel } from "@/components/landlord/ChatPanel";
import { RequirementsPanel } from "@/components/landlord/RequirementsPanel";
import { Reveal } from "@/components/landlord/Reveal";
import { StudentMatchCard } from "@/components/landlord/StudentMatchCard";
import { TourModal } from "@/components/landlord/TourModal";
import type {
  LandlordConversationMessage,
  LandlordListingDetail,
  LandlordListingDetailResponse,
  LandlordListingStatus,
  LandlordMatch,
  LandlordMatchesResponse,
  LandlordTour,
} from "@/lib/landlord-types";

const STATUS_STYLES: Record<LandlordListingStatus, string> = {
  active: "bg-sage/10 text-sage border-sage/20",
  paused: "bg-warm-gray/10 text-muted border-warm-gray/20",
  filled: "bg-accent/10 text-accent border-accent/20",
};

type AuthProfile = {
  name: string;
  picture?: string;
};

type ConversationMutationResponse = {
  conversationId: string;
  messages: LandlordConversationMessage[];
  error?: string;
};

type TourMutationResponse = {
  conversationId: string;
  messages: LandlordConversationMessage[];
  tour: LandlordTour | null;
  error?: string;
};

function updateMatchState(
  matches: LandlordMatch[],
  conversationId: string,
  updates: Partial<LandlordMatch>
): LandlordMatch[] {
  return matches.map((match) =>
    match.conversationId === conversationId
      ? {
          ...match,
          ...updates,
        }
      : match
  );
}

export default function ListingDetailPage({
  params,
}: {
  params: Promise<{ listingId: string }>;
}) {
  const { listingId } = use(params);
  const [authProfile, setAuthProfile] = useState<AuthProfile>({ name: "Host" });
  const [listing, setListing] = useState<LandlordListingDetail | null>(null);
  const [matches, setMatches] = useState<LandlordMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [tourStudentId, setTourStudentId] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [updatingTour, setUpdatingTour] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const [profileResponse, listingResponse, matchesResponse] = await Promise.all([
          fetch("/api/auth/profile"),
          fetch(`/api/landlord/listings/${listingId}`, { cache: "no-store" }),
          fetch(`/api/landlord/listings/${listingId}/matches`, { cache: "no-store" }),
        ]);

        if (profileResponse.ok) {
          const profile = (await profileResponse.json()) as Record<string, unknown>;
          const email = typeof profile.email === "string" ? profile.email : "";
          const defaultName = email.includes("@") ? email.split("@")[0] : "Host";
          const name =
            typeof profile.name === "string"
              ? profile.name
              : typeof profile.nickname === "string"
                ? profile.nickname
                : defaultName;
          const picture =
            typeof profile.picture === "string" ? profile.picture : undefined;

          if (!cancelled) {
            setAuthProfile({ name, picture });
          }
        }

        if (!listingResponse.ok || !matchesResponse.ok) {
          throw new Error("Could not load this listing.");
        }

        const listingPayload =
          (await listingResponse.json()) as LandlordListingDetailResponse;
        const matchesPayload =
          (await matchesResponse.json()) as LandlordMatchesResponse;

        if (!cancelled) {
          setListing(listingPayload.listing);
          setMatches(matchesPayload.matches);
        }
      } catch {
        if (!cancelled) {
          setError("Could not load this listing right now.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [listingId]);

  const activeStudent = matches.find((match) => match.id === activeChat) ?? null;
  const tourStudent = matches.find((match) => match.id === tourStudentId) ?? null;

  const handleSendMessage = async (text: string) => {
    if (!activeStudent?.conversationId) {
      setPanelError("This match does not have a conversation yet.");
      return;
    }

    setSendingMessage(true);
    setPanelError(null);

    try {
      const response = await fetch(
        `/api/landlord/conversations/${activeStudent.conversationId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text }),
        }
      );

      const payload = (await response.json()) as ConversationMutationResponse;
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not send that message.");
      }

      setMatches((currentMatches) =>
        updateMatchState(currentMatches, payload.conversationId, {
          messages: payload.messages,
          unreadCount: 0,
          status: "contacted",
        })
      );
    } catch (mutationError) {
      const nextError =
        mutationError instanceof Error
          ? mutationError
          : new Error("Could not send that message.");
      setPanelError(nextError.message);
      throw nextError;
    } finally {
      setSendingMessage(false);
    }
  };

  const handleProposeTour = async (slots: string[]) => {
    if (!tourStudent?.conversationId) {
      setPanelError("This match does not have a conversation yet.");
      return;
    }

    setUpdatingTour(true);
    setPanelError(null);

    try {
      const response = await fetch("/api/landlord/tours", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "propose",
          conversationId: tourStudent.conversationId,
          slots,
        }),
      });

      const payload = (await response.json()) as TourMutationResponse;
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not propose tour times.");
      }

      setMatches((currentMatches) =>
        updateMatchState(currentMatches, payload.conversationId, {
          messages: payload.messages,
          tour: payload.tour,
          unreadCount: 0,
          status: "contacted",
        })
      );
      setActiveChat(tourStudent.id);
      setTourStudentId(null);
    } catch (mutationError) {
      setPanelError(
        mutationError instanceof Error
          ? mutationError.message
          : "Could not propose tour times."
      );
    } finally {
      setUpdatingTour(false);
    }
  };

  const handleConfirmTour = async (slot: string) => {
    if (!activeStudent?.conversationId) {
      setPanelError("This match does not have a conversation yet.");
      return;
    }

    setUpdatingTour(true);
    setPanelError(null);

    try {
      const response = await fetch("/api/landlord/tours", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "confirm",
          conversationId: activeStudent.conversationId,
          selectedSlot: slot,
        }),
      });

      const payload = (await response.json()) as TourMutationResponse;
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not confirm this tour.");
      }

      setMatches((currentMatches) =>
        updateMatchState(currentMatches, payload.conversationId, {
          messages: payload.messages,
          tour: payload.tour,
          unreadCount: 0,
          status: "contacted",
        })
      );
    } catch (mutationError) {
      setPanelError(
        mutationError instanceof Error
          ? mutationError.message
          : "Could not confirm this tour."
      );
    } finally {
      setUpdatingTour(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 pt-24 pb-20">
          <div className="h-10 w-64 animate-pulse rounded-xl bg-surface" />
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
            <div className="min-h-[340px] animate-pulse rounded-2xl border border-warm-gray/10 bg-surface" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="min-h-[260px] animate-pulse rounded-2xl border border-warm-gray/10 bg-surface"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted">{error ?? "Listing not found."}</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background"
      style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
    >
      <nav className="sticky top-0 z-40 border-b border-warm-gray/10 bg-background/80 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-6 lg:px-10">
          <Link
            href="/"
            className="font-serif text-xs font-semibold uppercase tracking-[0.25em] text-foreground"
          >
            SUBLET-<span className="text-accent">ME</span>
          </Link>
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-accent to-orange-400 text-sm font-semibold text-white ring-2 ring-background shadow-sm">
            {authProfile.picture ? (
              <img
                src={authProfile.picture}
                alt={authProfile.name}
                className="h-full w-full object-cover"
              />
            ) : (
              authProfile.name.charAt(0).toUpperCase()
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 pt-8 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/landlord/dashboard"
              className="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <span className="text-warm-gray/30">/</span>
            <h1
              className="text-xl tracking-tight text-foreground"
              style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
            >
              {listing.title}
            </h1>
            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                STATUS_STYLES[listing.status]
              }`}
            >
              {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 pb-20 lg:px-10">
        {(() => {
          const processingState = listing.videoProcessing
            ? "processing"
            : listing.highlightUrl || listing.galleryImages.length > 0
              ? "ready"
              : "failed";
          if (processingState === "processing") {
            return (
              <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    AI media pipeline is still running.
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Generated gallery images and the highlight clip will appear here as soon as processing completes.
                  </p>
                </div>
                <Link
                  href={`/listings/${listing.id}`}
                  className="inline-flex items-center justify-center rounded-xl border border-accent/20 px-4 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent/5"
                >
                  View public listing
                </Link>
              </div>
            );
          }
          if (processingState === "failed") {
            return (
              <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-red-900">
                    Media generation did not complete.
                  </p>
                  <p className="mt-1 text-sm text-red-800/80">
                    The listing was created, but the AI media pipeline did not finish. The listing is still usable without generated media.
                  </p>
                </div>
                <Link
                  href={`/listings/${listing.id}`}
                  className="inline-flex items-center justify-center rounded-xl border border-accent/20 px-4 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent/5"
                >
                  View public listing
                </Link>
              </div>
            );
          }
          if (processingState === "ready") {
            return (
              <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-sage/20 bg-sage/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    AI media is ready for this listing.
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Preview the public listing page to show the polished gallery and highlight clip.
                  </p>
                </div>
                <Link
                  href={`/listings/${listing.id}`}
                  className="inline-flex items-center justify-center rounded-xl border border-accent/20 px-4 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent/5"
                >
                  View public listing
                </Link>
              </div>
            );
          }
          return null;
        })()}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr] lg:gap-8">
        <div className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-2xl border border-warm-gray/10">
            <div className="h-[180px] overflow-hidden">
              {listing.image ? (
                <img
                  src={listing.image}
                  alt={listing.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-surface text-sm text-muted">
                  Listing media is still processing.
                </div>
              )}
            </div>
            <div className="p-4">
              <p className="text-sm font-semibold text-foreground">{listing.title}</p>
              <p className="mt-0.5 text-xs text-muted">{listing.address}</p>
              <div className="mt-2 flex items-center gap-3 text-xs text-muted">
                <span>${listing.price}/mo</span>
                <span className="h-1 w-1 rounded-full bg-warm-gray/30" />
                <span>{listing.dates}</span>
              </div>
            </div>
          </div>

          <RequirementsPanel requirements={listing.requirements} listingId={listing.id} />
        </div>

        <div>
          <Reveal className="mb-5">
            <div className="flex items-baseline justify-between">
              <h2
                className="text-xl tracking-tight text-foreground"
                style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
              >
                {matches.length} students matched
              </h2>
              <span className="text-xs text-muted">Ranked by AI score</span>
            </div>
          </Reveal>

          {matches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-warm-gray/20 bg-surface px-6 py-12 text-center">
              <p className="text-base font-semibold text-foreground">
                No seeded matches for this listing yet.
              </p>
              <p className="mt-2 text-sm text-muted">
                Create demo matches in the seed script or wait for the matching flow to land.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {matches.map((student, index) => (
                <Reveal key={student.id} delay={index * 0.06}>
                  <StudentMatchCard
                    student={student}
                    listingRequirementTags={listing.requirements.lifestyleTags}
                    onMessage={() => {
                      setPanelError(null);
                      setActiveChat(student.id);
                    }}
                    onScheduleTour={() => {
                      setPanelError(null);
                      setTourStudentId(student.id);
                    }}
                  />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>

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
              onClose={() => setActiveChat(null)}
              onScheduleTour={() => {
                setTourStudentId(activeStudent.id);
              }}
              onSendMessage={handleSendMessage}
              onConfirmTourSlot={handleConfirmTour}
              sendingMessage={sendingMessage}
              updatingTour={updatingTour}
              errorMessage={panelError}
            />
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {tourStudent && (
          <TourModal
            key="tour-modal"
            studentName={tourStudent.name}
            onClose={() => setTourStudentId(null)}
            onConfirm={handleProposeTour}
            isSubmitting={updatingTour}
            errorMessage={panelError}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
