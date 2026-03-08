"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Building2, Users, MessageSquare, Video, X } from "lucide-react";
import { LANDLORD, LISTINGS } from "@/lib/landlord-mock";
import { LandlordListingCard } from "@/components/landlord/LandlordListingCard";
import { StatCard } from "@/components/landlord/StatCard";
import { Reveal } from "@/components/landlord/Reveal";

type AuthProfile = {
  name: string;
  picture?: string;
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function LandlordDashboardPage() {
  const [authProfile, setAuthProfile] = useState<AuthProfile>({
    name: LANDLORD.name,
  });
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const totalMatches = LISTINGS.reduce((sum, l) => sum + l.matches, 0);
  const activeListings = LISTINGS.filter((l) => l.status === "active").length;

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const response = await fetch("/auth/profile");
        if (!response.ok) return;

        const profile = (await response.json()) as Record<string, unknown>;
        const email = typeof profile.email === "string" ? profile.email : "";
        const defaultName = email.includes("@") ? email.split("@")[0] : LANDLORD.name;
        const name =
          typeof profile.name === "string"
            ? profile.name
            : typeof profile.nickname === "string"
              ? profile.nickname
              : defaultName;
        const picture =
          typeof profile.picture === "string" ? profile.picture : undefined;

        setAuthProfile({ name, picture });
      } catch {
        // No-op: keep fallback identity if profile endpoint is unavailable.
      }
    };

    void loadUserProfile();
  }, []);

  return (
    <div
      className="min-h-screen bg-background"
      style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
    >
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-warm-gray/10">
        <div className="px-6 lg:px-10 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="font-serif text-xs tracking-[0.25em] uppercase font-semibold text-foreground"
          >
            SUBLET-<span className="text-accent">ME</span>
          </Link>
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative w-9 h-9 rounded-full bg-warm-gray/8 flex items-center justify-center hover:bg-warm-gray/15 transition-colors"
              >
                <svg
                  className="w-4.5 h-4.5 text-foreground/60"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                  />
                </svg>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
              </button>

              {/* Notifications Panel */}
              <AnimatePresence>
                {notificationsOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-40"
                      onClick={() => setNotificationsOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 w-80 bg-surface rounded-xl shadow-xl border border-warm-gray/10 z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-warm-gray/10 flex items-center justify-between">
                        <h3
                          className="text-foreground font-semibold text-sm"
                          style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
                        >
                          Notifications
                        </h3>
                        <button
                          onClick={() => setNotificationsOpen(false)}
                          className="w-6 h-6 rounded-full hover:bg-warm-gray/10 flex items-center justify-center transition-colors"
                        >
                          <X className="w-4 h-4 text-muted" />
                        </button>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {/* Sample notifications */}
                        <div className="p-4 border-b border-warm-gray/10 hover:bg-warm-gray/5 transition-colors cursor-pointer">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                              <Users className="w-5 h-5 text-accent" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">
                                New match for Sunny Studio
                              </p>
                              <p className="text-xs text-muted mt-0.5">
                                Aisha Rahman matched with your listing
                              </p>
                              <p className="text-[10px] text-muted/60 mt-1">2 hours ago</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 border-b border-warm-gray/10 hover:bg-warm-gray/5 transition-colors cursor-pointer">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-sage/10 flex items-center justify-center flex-shrink-0">
                              <MessageSquare className="w-5 h-5 text-sage" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">
                                New message from Chris
                              </p>
                              <p className="text-xs text-muted mt-0.5">
                                "Is the unit still available?"
                              </p>
                              <p className="text-[10px] text-muted/60 mt-1">5 hours ago</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 border-b border-warm-gray/10 hover:bg-warm-gray/5 transition-colors cursor-pointer">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-orange-400/10 flex items-center justify-center flex-shrink-0">
                              <Video className="w-5 h-5 text-orange-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">
                                Tour scheduled
                              </p>
                              <p className="text-xs text-muted mt-0.5">
                                Virtual tour with Sophia tomorrow at 2 PM
                              </p>
                              <p className="text-[10px] text-muted/60 mt-1">1 day ago</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 text-center border-t border-warm-gray/10">
                          <Link
                            href="/landlord/notifications"
                            onClick={() => setNotificationsOpen(false)}
                            className="text-xs font-medium text-accent hover:underline block"
                          >
                            View all notifications
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-accent to-orange-400 flex items-center justify-center text-white font-semibold text-sm cursor-pointer ring-2 ring-background shadow-sm">
              {authProfile.picture ? (
                <img
                  src={authProfile.picture}
                  alt={authProfile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                authProfile.name.charAt(0).toUpperCase()
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Greeting */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-10 pt-12 pb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-muted text-sm mb-2">
            {getGreeting()}, {authProfile.name}
          </p>
          <h1
            className="text-foreground text-4xl md:text-5xl lg:text-[3.5rem] tracking-tight leading-[1.05]"
            style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
          >
            Your listings are
            <br />
            <span className="text-accent">working for you.</span>
          </h1>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8"
        >
          <StatCard
            label="Active listings"
            value={activeListings}
            icon={<Building2 className="w-5 h-5 text-foreground/50" />}
          />
          <StatCard
            label="Total matches"
            value={totalMatches}
            highlight
            icon={<Users className="w-5 h-5 text-accent" />}
          />
          <StatCard
            label="Unread messages"
            value={3}
            icon={<MessageSquare className="w-5 h-5 text-foreground/50" />}
          />
          <StatCard
            label="Upcoming tours"
            value={1}
            icon={<Video className="w-5 h-5 text-foreground/50" />}
          />
        </motion.div>
      </section>

      {/* Listings */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-10 pt-10 pb-20">
        <Reveal className="mb-6">
          <div className="flex items-baseline justify-between">
            <h2
              className="text-foreground text-xl tracking-tight"
              style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
            >
              Your listings
            </h2>
            <span className="text-xs text-muted">
              {LISTINGS.length} listings
            </span>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {LISTINGS.map((listing, i) => (
            <Reveal key={listing.id} delay={i * 0.07}>
              <LandlordListingCard listing={listing} />
            </Reveal>
          ))}

          {/* Add listing card */}
          <Reveal delay={LISTINGS.length * 0.07}>
            <Link href="/landlord/dashboard/new">
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
                className="rounded-2xl border-2 border-dashed border-warm-gray/15 flex items-center justify-center cursor-pointer hover:border-warm-gray/30 transition-colors group min-h-[320px]"
              >
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-warm-gray/8 flex items-center justify-center mx-auto mb-3 group-hover:bg-warm-gray/15 transition-colors">
                    <svg
                      className="w-6 h-6 text-muted"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-muted">Add listing</p>
                </div>
              </motion.div>
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
