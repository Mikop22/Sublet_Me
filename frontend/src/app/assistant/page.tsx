"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type ChatTurn = {
  role: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
};

type HistoryResponse = {
  session_id: string | null;
  turns: ChatTurn[];
};

type ListingResult = {
  id: string;
  title: string;
  city: string;
  price: number;
  reasons: string[];
};

type TurnResponse = {
  session_id: string;
  assistant_message: string;
  next_action: string;
  confidence: number;
  listings?: ListingResult[];
};

export default function AssistantPage() {
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [lastListings, setLastListings] = useState<ListingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hydrateHistory = async () => {
      try {
        const response = await fetch("/api/subletops/turn", { cache: "no-store" });
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as HistoryResponse;
        if (payload.session_id) {
          setSessionId(payload.session_id);
        }
        if (Array.isArray(payload.turns) && payload.turns.length > 0) {
          setTurns(payload.turns);
        }
      } catch {
        // Keep chat usable even if history hydration fails.
      }
    };

    void hydrateHistory();
  }, []);

  const canSubmit = useMemo(
    () => input.trim().length > 0 && !isLoading,
    [input, isLoading]
  );

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    setError(null);
    const userMessage = input.trim();
    setInput("");
    setTurns((prev) => [
      ...prev,
      {
        role: "user",
        message: userMessage,
        timestamp: new Date().toISOString(),
      },
    ]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/subletops/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionId,
          metadata: { source: "assistant_page" },
        }),
      });

      if (!response.ok) {
        throw new Error("assistant turn failed");
      }

      const payload = (await response.json()) as TurnResponse;
      setSessionId(payload.session_id);
      setTurns((prev) => [
        ...prev,
        {
          role: "assistant",
          message: payload.assistant_message,
          timestamp: new Date().toISOString(),
          metadata: {
            next_action: payload.next_action,
            confidence: payload.confidence,
          },
        },
      ]);
      setLastListings(payload.listings ?? []);
    } catch {
      setError("Could not reach the assistant. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 lg:px-10 py-8">
        <header className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-muted mb-1">
              SubletOps
            </p>
            <h1
              className="text-3xl md:text-4xl text-foreground tracking-tight"
              style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
            >
              Listings Assistant
            </h1>
          </div>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-accent hover:text-accent/80 transition-colors"
          >
            Back to dashboard
          </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 border border-warm-gray/20 rounded-2xl bg-surface p-4 md:p-5">
            <div className="h-[430px] overflow-y-auto space-y-4 pr-1">
              {turns.length === 0 ? (
                <div className="text-sm text-muted">
                  Ask for listings like: &quot;Find Toronto listings under $1000 for
                  Summer 2026.&quot;
                </div>
              ) : (
                turns.map((turn, index) => (
                  <div
                    key={`${turn.timestamp}-${index}`}
                    className={`rounded-xl px-4 py-3 ${
                      turn.role === "user"
                        ? "bg-accent text-white ml-10"
                        : "bg-background border border-warm-gray/15 mr-10"
                    }`}
                  >
                    <p className="text-xs opacity-80 mb-1 uppercase tracking-wide">
                      {turn.role}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{turn.message}</p>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="rounded-xl px-4 py-3 bg-background border border-warm-gray/15 mr-10 text-sm text-muted">
                  Thinking...
                </div>
              )}
            </div>

            <form onSubmit={onSubmit} className="mt-4 flex gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Search listings by city, budget, and term..."
                className="flex-1 px-4 py-3 rounded-xl border border-warm-gray/30 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              <button
                type="submit"
                disabled={!canSubmit}
                className="px-5 py-3 rounded-xl bg-accent text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </form>
            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
          </section>

          <aside className="border border-warm-gray/20 rounded-2xl bg-surface p-4 md:p-5">
            <h2
              className="text-xl text-foreground tracking-tight mb-3"
              style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
            >
              Latest Matches
            </h2>
            {lastListings.length === 0 ? (
              <p className="text-sm text-muted">
                Listing matches appear here after a search request.
              </p>
            ) : (
              <div className="space-y-3">
                {lastListings.slice(0, 5).map((listing) => (
                  <div
                    key={listing.id}
                    className="rounded-xl border border-warm-gray/20 bg-background p-3"
                  >
                    <p className="font-semibold text-sm text-foreground">
                      {listing.title}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      {listing.city} · ${listing.price}/mo
                    </p>
                    <p className="text-xs text-muted mt-1">
                      {listing.reasons?.[0] ?? "Matched to your request."}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
