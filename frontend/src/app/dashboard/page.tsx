"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";

// ————— Default preferences (until persisted profile exists) —————
const DEFAULT_PREFERENCES = {
  city: "Toronto",
  term: "Summer 2025",
  budget: 900,
  lifestyles: ["Night owl", "Social butterfly", "Fitness lover"],
  university: "University of Waterloo",
};

// ————— Mock Listings —————
const LISTINGS: Listing[] = [
  {
    id: 1,
    title: "Sunny Studio in Liberty Village",
    address: "45 Liberty St",
    price: 850,
    dates: "May 1 - Aug 31",
    image:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop&q=80",
    host: {
      name: "Alex Chen",
      uni: "UofT",
      avatar:
        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop&crop=face&q=80",
    },
    sharedTags: ["Night owl"],
    match: 94,
    beds: 1,
    type: "Studio",
  },
  {
    id: 2,
    title: "Modern 1BR near King West",
    address: "220 King St W",
    price: 875,
    dates: "May 1 - Aug 31",
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop&q=80",
    host: {
      name: "Sarah Kim",
      uni: "TMU",
      avatar:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face&q=80",
    },
    sharedTags: ["Fitness lover"],
    match: 91,
    beds: 1,
    type: "Apartment",
  },
  {
    id: 3,
    title: "Cozy Room in Shared House",
    address: "88 Brunswick Ave, Annex",
    price: 650,
    dates: "May 1 - Aug 28",
    image:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&q=80",
    host: {
      name: "Marcus Johnson",
      uni: "York",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face&q=80",
    },
    sharedTags: ["Social butterfly"],
    match: 89,
    beds: 1,
    type: "Room",
  },
  {
    id: 4,
    title: "Bright Loft in Distillery",
    address: "15 Mill St",
    price: 920,
    dates: "May 5 - Aug 31",
    image:
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop&q=80",
    host: {
      name: "Priya Patel",
      uni: "UofT",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face&q=80",
    },
    sharedTags: ["Fitness lover", "Night owl"],
    match: 96,
    beds: 1,
    type: "Loft",
  },
  {
    id: 5,
    title: "Furnished Room near Yonge & Eg",
    address: "2200 Yonge St",
    price: 780,
    dates: "May 1 - Aug 31",
    image:
      "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800&h=600&fit=crop&q=80",
    host: {
      name: "Jordan Lee",
      uni: "UofT",
      avatar:
        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop&crop=face&q=80",
    },
    sharedTags: ["Night owl"],
    match: 87,
    beds: 1,
    type: "Room",
  },
  {
    id: 6,
    title: "Spacious 2BR in Kensington",
    address: "34 Kensington Ave",
    price: 700,
    dates: "May 1 - Aug 25",
    image:
      "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&h=600&fit=crop&q=80",
    host: {
      name: "Emma Wilson",
      uni: "OCAD",
      avatar:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face&q=80",
    },
    sharedTags: ["Social butterfly"],
    match: 85,
    beds: 2,
    type: "Apartment",
  },
  {
    id: 7,
    title: "Studio with CN Tower View",
    address: "10 Navy Wharf Ct",
    price: 890,
    dates: "May 1 - Aug 31",
    image:
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop&q=80",
    host: {
      name: "David Park",
      uni: "TMU",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face&q=80",
    },
    sharedTags: ["Fitness lover"],
    match: 90,
    beds: 1,
    type: "Studio",
  },
  {
    id: 8,
    title: "Charming Room in Leslieville",
    address: "1050 Queen St E",
    price: 750,
    dates: "May 3 - Aug 30",
    image:
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop&q=80",
    host: {
      name: "Maya Singh",
      uni: "UofT",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face&q=80",
    },
    sharedTags: [],
    match: 82,
    beds: 1,
    type: "Room",
  },
];

// ————— Mock Roommates —————
const ROOMMATES = [
  {
    id: 1,
    name: "Chris Taylor",
    uni: "McMaster",
    avatar:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop&crop=face&q=80",
    tags: ["Night owl", "Fitness lover"],
    looking: "Looking for a room",
  },
  {
    id: 2,
    name: "Aisha Rahman",
    uni: "UWaterloo",
    avatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face&q=80",
    tags: ["Social butterfly", "Neat freak"],
    looking: "Looking for a roommate",
  },
  {
    id: 3,
    name: "Tyler O'Brien",
    uni: "Queen's",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face&q=80",
    tags: ["Night owl", "Social butterfly"],
    looking: "Looking for a room",
  },
  {
    id: 4,
    name: "Sophia Martinez",
    uni: "McGill",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face&q=80",
    tags: ["Early bird", "Fitness lover"],
    looking: "Looking for a roommate",
  },
];

// ————— Types —————
type Listing = {
  id: number;
  title: string;
  address: string;
  price: number;
  dates: string;
  image: string;
  host: { name: string; uni: string; avatar: string };
  sharedTags: string[];
  match: number;
  beds: number;
  type: string;
};

type AuthProfile = {
  name: string;
  picture?: string;
};

type SubletOpsMatchResponse = {
  profile?: {
    city?: string | null;
    term?: string | null;
    budget?: number | null;
    university?: string | null;
    lifestyle_tags?: string[];
  };
  listings?: Array<{
    id: string;
    title: string;
    address: string;
    price: number;
    dates: string;
    image: string;
    host_name: string;
    host_university: string;
    host_avatar: string;
    match: number;
    beds: number;
    type: string;
  }>;
};

// ————— Animated Counter —————
function AnimatedCount({ target }: { target: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1200;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(eased * target);
      setCount(start);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, target]);

  return <span ref={ref}>{count}</span>;
}

// ————— Section Reveal Wrapper —————
function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ————— Greeting Helper —————
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

// ————— Listing Card —————
function ListingCard({
  listing,
  variant = "default",
  saved,
  onToggleSave,
}: {
  listing: Listing;
  variant?: "featured" | "default";
  saved: boolean;
  onToggleSave: () => void;
}) {
  const isFeatured = variant === "featured";

  return (
    <Link href={`/listings/${listing.id}`} className={isFeatured ? "w-[380px] md:w-[420px] flex-shrink-0 snap-start" : "w-full block"}>
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
      className={`group relative rounded-2xl overflow-hidden cursor-pointer bg-surface border border-warm-gray/10 w-full`}
    >
      {/* Image */}
      <div
        className={`relative overflow-hidden ${isFeatured ? "h-[280px]" : "h-[220px]"
          }`}
      >
        <motion.img
          src={listing.image}
          alt={listing.title}
          className="w-full h-full object-cover"
          whileHover={{ scale: 1.06 }}
          transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Price badge */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
          <span className="text-sm font-bold text-foreground">
            ${listing.price}
          </span>
          <span className="text-xs text-muted">/mo</span>
        </div>


        {/* Save button */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave();
          }}
          whileTap={{ scale: 0.85 }}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm cursor-pointer hover:bg-white transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-colors ${saved ? "text-accent fill-accent" : "text-foreground/40"
              }`}
            viewBox="0 0 24 24"
            fill={saved ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
        </motion.button>

      </div>

      {/* Content */}
      <div className="p-4 pb-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 className="font-semibold text-foreground text-[15px] leading-tight group-hover:text-accent transition-colors">
              {listing.title}
            </h3>
            <p className="text-muted text-xs mt-1">{listing.address}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            {listing.host.avatar ? (
              <img
                src={listing.host.avatar}
                alt={listing.host.name}
                className="w-6 h-6 rounded-full object-cover ring-1 ring-warm-gray/20"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-warm-gray/20 ring-1 ring-warm-gray/20" />
            )}
            <div>
              <p className="text-xs font-medium text-foreground leading-tight">
                {listing.host.name}
              </p>
              <p className="text-[10px] text-muted">{listing.host.uni}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-muted">
            <span className="text-[11px]">{listing.dates}</span>
          </div>
        </div>
      </div>
    </motion.div>
    </Link>
  );
}

// ————— Roommate Card —————
function RoommateCard({
  person,
  userTags,
}: {
  person: (typeof ROOMMATES)[0];
  userTags: string[];
}) {
  const shared = person.tags.filter((t) => userTags.includes(t));

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25 }}
      className="bg-surface border border-warm-gray/10 rounded-2xl p-5 cursor-pointer group hover:border-warm-gray/25 transition-colors"
    >
      <div className="flex items-center gap-3.5 mb-4">
        <div className="relative">
          <img
            src={person.avatar}
            alt={person.name}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-warm-gray/10"
          />
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-sage rounded-full border-2 border-surface flex items-center justify-center">
            <svg
              className="w-2.5 h-2.5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
        <div>
          <p className="font-semibold text-foreground text-sm">
            {person.name}
          </p>
          <p className="text-xs text-muted">{person.uni}</p>
        </div>
      </div>

      <p className="text-xs text-muted/70 mb-3">{person.looking}</p>

      <div className="flex flex-wrap gap-1.5">
        {person.tags.map((tag) => (
          <span
            key={tag}
            className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${shared.includes(tag)
              ? "bg-accent/10 text-accent border border-accent/15"
              : "bg-warm-gray/10 text-muted/70"
              }`}
          >
            {tag}
            {shared.includes(tag) && " *"}
          </span>
        ))}
      </div>

      <button className="mt-4 w-full py-2.5 rounded-xl text-xs font-semibold text-foreground bg-warm-gray/8 hover:bg-warm-gray/15 transition-colors cursor-pointer border border-warm-gray/10">
        Connect
      </button>
    </motion.div>
  );
}

// ————— Module-level listings cache (persists across navigations) —————
let _listingsCache: Listing[] | null = null;

// ————— Main Dashboard —————
export default function DashboardPage() {
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [authProfile, setAuthProfile] = useState<AuthProfile>({
    name: "Student",
  });
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [recommendedListings, setRecommendedListings] = useState<Listing[]>(_listingsCache ?? []);
  const [listingsLoading, setListingsLoading] = useState(_listingsCache === null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadDashboardState = async () => {
      try {
        const response = await fetch("/api/auth/profile");
        if (!response.ok) return;

        const profile = (await response.json()) as Record<string, unknown>;
        const email = typeof profile.email === "string" ? profile.email : "";
        const defaultName = email.includes("@") ? email.split("@")[0] : "Student";
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

      if (_listingsCache !== null) return;

      try {
        const listingsResponse = await fetch("/api/listings");
        if (!listingsResponse.ok) return;

        const mongoListings = await listingsResponse.json();
        _listingsCache = mongoListings;
        setRecommendedListings(mongoListings);
      } catch {
        // Keep fallback mock recommendations when API is unavailable.
      } finally {
        setListingsLoading(false);
      }
    };

    void loadDashboardState();
  }, []);

  const toggleSave = (id: number) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openLogoutConfirm = () => {
    setShowLogoutConfirm(true);
  };

  const closeLogoutConfirm = () => {
    setShowLogoutConfirm(false);
  };

  const confirmLogout = () => {
    window.location.assign("/auth/logout");
  };

  const topPicks = recommendedListings.filter((l) => l.match >= 90).sort(
    (a, b) => b.match - a.match
  );
  const allListings = [...recommendedListings].sort((a, b) => b.match - a.match);

  const greeting = getGreeting();
  const matchCount = recommendedListings.length;
  const filterPills = [
    preferences.city,
    preferences.term,
    `Under $${preferences.budget}/mo`,
    ...preferences.lifestyles,
  ];

  return (
    <div
      className="min-h-screen bg-background"
      style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
    >
      {/* ————— Nav Bar ————— */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-warm-gray/10">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="font-serif text-xs tracking-[0.25em] uppercase font-semibold text-foreground"
          >
            SUBLET-<span className="text-accent">ME</span>
          </Link>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={openLogoutConfirm}
              className="text-xs font-medium text-muted hover:text-foreground transition-colors cursor-pointer"
            >
              Log out
            </button>
            <Link
              href="/assistant"
              className="text-xs font-medium text-muted hover:text-foreground transition-colors"
            >
              Assistant
            </Link>
            {/* Saved count */}
            {savedIds.size > 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/8 border border-accent/12"
              >
                <svg
                  className="w-3.5 h-3.5 text-accent fill-accent"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
                <span className="text-xs font-semibold text-accent">
                  {savedIds.size}
                </span>
              </motion.div>
            )}

            {/* Profile */}
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

      {/* ————— Greeting Section ————— */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-10 pt-12 pb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-muted text-sm mb-2">
            {greeting}, {authProfile.name}
          </p>
          <h1
            className="text-foreground text-4xl md:text-5xl lg:text-[3.5rem] tracking-tight leading-[1.05]"
            style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
          >
            <AnimatedCount target={matchCount} /> places waiting
            <br />
            for you in{" "}
            <span className="text-accent">{preferences.city}</span>.
          </h1>
        </motion.div>

        {/* Filter pills */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-wrap gap-2 mt-6"
        >
          {filterPills.map((pill, i) => (
            <span
              key={pill}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-default ${i < 3
                ? "bg-foreground/[0.04] border-foreground/10 text-foreground"
                : "bg-transparent border-warm-gray/20 text-muted"
                }`}
            >
              {pill}
            </span>
          ))}
          <Link
            href="/create-profile"
            className="px-3.5 py-1.5 rounded-full text-xs font-medium text-accent border border-accent/20 hover:bg-accent/5 transition-colors"
          >
            Edit preferences
          </Link>
        </motion.div>
      </section>

      {/* ————— Listings (fade in once loaded) ————— */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: listingsLoading ? 0 : 1 }}
        transition={{ duration: 0.4 }}
      >

      {/* ————— Top Picks: Horizontal Scroll ————— */}
      <section className="mt-10">
        <Reveal className="max-w-[1400px] mx-auto px-6 lg:px-10 mb-5">
          <div className="flex items-baseline justify-between">
            <h2
              className="text-foreground text-xl tracking-tight"
              style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
            >
              Top picks for you
            </h2>
            <span className="text-xs text-muted">
              Based on your lifestyle & budget
            </span>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto snap-x snap-mandatory pl-6 lg:pl-10 pr-6 pb-4 scrollbar-hide"
            style={{ scrollbarWidth: "none" }}
          >
            {topPicks.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                variant="featured"
                saved={savedIds.has(listing.id)}
                onToggleSave={() => toggleSave(listing.id)}
              />
            ))}
            {/* "See all" card */}
            <div className="w-[200px] flex-shrink-0 snap-start rounded-2xl border-2 border-dashed border-warm-gray/15 flex items-center justify-center cursor-pointer hover:border-warm-gray/30 transition-colors group">
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-warm-gray/8 flex items-center justify-center mx-auto mb-3 group-hover:bg-warm-gray/15 transition-colors">
                  <svg
                    className="w-5 h-5 text-muted"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-muted">See all</p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ————— Pull Quote Divider ————— */}
      <Reveal className="max-w-[1400px] mx-auto px-6 lg:px-10 py-14">
        <div className="flex items-center gap-6">
          <div className="flex-1 h-px bg-warm-gray/12" />
          <div className="text-center flex-shrink-0">
            <p
              className="text-foreground text-3xl md:text-4xl tracking-tight"
              style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
            >
              48 hrs
            </p>
            <p className="text-muted text-xs mt-1 tracking-wide">
              avg. time to find a match
            </p>
          </div>
          <div className="flex-1 h-px bg-warm-gray/12" />
        </div>
      </Reveal>

      {/* ————— All Matches: Bento Grid ————— */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-10 pb-10">
        <Reveal className="mb-6">
          <div className="flex items-baseline justify-between">
            <h2
              className="text-foreground text-xl tracking-tight"
              style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
            >
              All matches
            </h2>
            <span className="text-xs text-muted">
              {allListings.length} listings
            </span>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {allListings.map((listing, i) => (
            <Reveal key={listing.id} delay={i * 0.05}>
              <ListingCard
                listing={listing}
                saved={savedIds.has(listing.id)}
                onToggleSave={() => toggleSave(listing.id)}
              />
            </Reveal>
          ))}
        </div>
      </section>


      {/* ————— Bottom CTA ————— */}
      <Reveal>
        <section className="max-w-[1400px] mx-auto px-6 lg:px-10 pb-20">
          <div className="bg-foreground rounded-[2rem] p-10 md:p-14 relative overflow-hidden">
            {/* Noise */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
              <svg width="100%" height="100%">
                <defs>
                  <filter id="noise-cta">
                    <feTurbulence
                      type="fractalNoise"
                      baseFrequency="0.8"
                      numOctaves="4"
                      stitchTiles="stitch"
                    />
                  </filter>
                </defs>
                <rect
                  width="100%"
                  height="100%"
                  filter="url(#noise-cta)"
                />
              </svg>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h3
                  className="text-surface text-2xl md:text-3xl tracking-tight mb-2"
                  style={{
                    fontFamily: "var(--font-dm-serif), Georgia, serif",
                  }}
                >
                  Not seeing what you need?
                </h3>
                <p className="text-surface/50 text-sm max-w-md">
                  Adjust your preferences or expand your search to nearby
                  cities. New listings are added every day.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <Link
                  href="/create-profile"
                  className="px-6 py-3 rounded-full bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors shadow-[0_6px_20px_rgba(232,93,74,0.3)]"
                >
                  Edit preferences
                </Link>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      </motion.div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-6">
          <button
            type="button"
            aria-label="Close logout confirmation"
            onClick={closeLogoutConfirm}
            className="absolute inset-0 bg-foreground/35 backdrop-blur-[2px]"
          />

          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md rounded-3xl bg-surface border border-warm-gray/15 p-6 md:p-7 shadow-xl"
          >
            <h3
              className="text-foreground text-2xl tracking-tight"
              style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
            >
              Log out?
            </h3>
            <p className="text-sm text-muted mt-2">
              You’ll need to sign in again to access your dashboard.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeLogoutConfirm}
                className="px-4 py-2.5 rounded-full text-sm font-semibold text-foreground bg-warm-gray/10 hover:bg-warm-gray/15 transition-colors border border-warm-gray/15 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-accent hover:bg-accent/90 transition-colors cursor-pointer"
              >
                Log out
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ————— Footer ————— */}
      <footer className="border-t border-warm-gray/10 py-8">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 flex items-center justify-between">
          <span
            className="text-muted/40 text-sm"
            style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
          >
            Sublet-Me
          </span>
          <span className="text-muted/30 text-xs">
            Verified student housing for Canadian co-ops
          </span>
        </div>
      </footer>
    </div>
  );
}
