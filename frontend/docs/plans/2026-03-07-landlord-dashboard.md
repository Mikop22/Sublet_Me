# Landlord Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a landlord dashboard where subletters can manage their listings, view AI-matched student profiles, message matches, and schedule Google Meet virtual tours.

**Architecture:** Overview-first with drill-down — a landing page shows all listings + stats, clicking a listing opens a detail page with matched students and messaging. Chat and tour scheduling live in a slide-in panel to keep context intact. All data is mocked (no backend yet).

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Framer Motion, Lucide React

---

## Key File Paths

- Design doc: `docs/plans/2026-03-07-landlord-dashboard-design.md`
- Existing subletter dashboard (reference for style): `src/app/dashboard/page.tsx`
- Existing profile form (reference for form style): `src/app/create-profile/page.tsx`
- Layout (fonts, globals): `src/app/layout.tsx`

## Font & Color Notes

- Serif heading font: `var(--font-dm-serif)` (actually Fraunces, aliased)
- Body font: `var(--font-inter)`
- Color tokens used throughout: `bg-background`, `bg-surface`, `text-foreground`, `text-muted`, `text-accent`, `border-warm-gray/10`
- Card pattern: `rounded-2xl border border-warm-gray/10 bg-surface`
- Motion pattern: `whileHover={{ y: -4 }}` with `transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}`

---

## Task 1: Mock Data & Types

**Files:**
- Create: `src/lib/landlord-mock.ts`

### Step 1: Create the file with all mock data and types

```typescript
// src/lib/landlord-mock.ts

export type ListingStatus = "active" | "paused" | "filled";

export type Listing = {
  id: number;
  title: string;
  address: string;
  price: number;
  dates: string;
  image: string;
  status: ListingStatus;
  matches: number;
  views: number;
  inquiries: number;
  requirements: Requirements;
};

export type Requirements = {
  budgetMin: number;
  budgetMax: number;
  lifestyleTags: string[];
  termPreference: string;
  petPolicy: "no-pets" | "pets-ok";
  genderPreference: "no-preference" | "male" | "female" | "non-binary";
  occupants: number;
  referencesRequired: boolean;
};

export type StudentMatch = {
  id: number;
  name: string;
  university: string;
  term: string;
  avatar: string;
  match: number;
  lifestyleTags: string[];
  bio: string;
};

export type Message = {
  id: number;
  senderId: "landlord" | number; // number = student id
  text: string;
  timestamp: string;
  type?: "tour-proposal" | "tour-confirmed" | "text";
  tourSlots?: string[];
  selectedSlot?: string;
  meetLink?: string;
};

export type Conversation = {
  listingId: number;
  studentId: number;
  messages: Message[];
};

export const LANDLORD = {
  name: "Jordan",
};

export const LISTINGS: Listing[] = [
  {
    id: 1,
    title: "Sunny Studio in Liberty Village",
    address: "45 Liberty St, Toronto",
    price: 850,
    dates: "May 1 - Aug 31",
    image:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop&q=80",
    status: "active",
    matches: 4,
    views: 38,
    inquiries: 2,
    requirements: {
      budgetMin: 800,
      budgetMax: 950,
      lifestyleTags: ["Non-smoker", "Quiet & studious", "Neat freak"],
      termPreference: "Summer 2025",
      petPolicy: "no-pets",
      genderPreference: "no-preference",
      occupants: 1,
      referencesRequired: true,
    },
  },
  {
    id: 2,
    title: "Modern 1BR near King West",
    address: "220 King St W, Toronto",
    price: 1100,
    dates: "May 1 - Aug 31",
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop&q=80",
    status: "active",
    matches: 7,
    views: 64,
    inquiries: 5,
    requirements: {
      budgetMin: 1000,
      budgetMax: 1200,
      lifestyleTags: ["Fitness lover", "Social butterfly"],
      termPreference: "Summer 2025",
      petPolicy: "pets-ok",
      genderPreference: "no-preference",
      occupants: 1,
      referencesRequired: false,
    },
  },
  {
    id: 3,
    title: "Cozy Room in Shared House",
    address: "88 Brunswick Ave, Toronto",
    price: 650,
    dates: "May 1 - Aug 28",
    image:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&q=80",
    status: "paused",
    matches: 2,
    views: 21,
    inquiries: 1,
    requirements: {
      budgetMin: 600,
      budgetMax: 700,
      lifestyleTags: ["Night owl", "Social butterfly"],
      termPreference: "Summer 2025",
      petPolicy: "no-pets",
      genderPreference: "no-preference",
      occupants: 1,
      referencesRequired: false,
    },
  },
];

export const STUDENT_MATCHES: Record<number, StudentMatch[]> = {
  1: [
    {
      id: 101,
      name: "Aisha Rahman",
      university: "University of Waterloo",
      term: "Summer 2025",
      avatar:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face&q=80",
      match: 96,
      lifestyleTags: ["Non-smoker", "Quiet & studious", "Early bird"],
      bio: "3B Computer Science co-op. Looking for a quiet place to focus during my internship at a downtown tech company.",
    },
    {
      id: 102,
      name: "Chris Taylor",
      university: "McMaster University",
      term: "Summer 2025",
      avatar:
        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop&crop=face&q=80",
      match: 91,
      lifestyleTags: ["Non-smoker", "Neat freak", "Fitness lover"],
      bio: "Engineering student on my second co-op. Very tidy, respectful of shared spaces.",
    },
    {
      id: 103,
      name: "Sophia Martinez",
      university: "McGill University",
      term: "Summer 2025",
      avatar:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face&q=80",
      match: 88,
      lifestyleTags: ["Non-smoker", "Yogi", "Plant parent"],
      bio: "Finance student interning at a Bay St firm. Early riser, very clean.",
    },
    {
      id: 104,
      name: "Tyler O'Brien",
      university: "Queen's University",
      term: "Summer 2025",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face&q=80",
      match: 84,
      lifestyleTags: ["Non-smoker", "Quiet & studious", "Coffee addict"],
      bio: "Commerce student on my first co-op rotation. Responsible, good references available.",
    },
  ],
  2: [
    {
      id: 201,
      name: "Maya Singh",
      university: "University of Toronto",
      term: "Summer 2025",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face&q=80",
      match: 94,
      lifestyleTags: ["Fitness lover", "Social butterfly", "Foodie"],
      bio: "UofT Rotman MBA intern at a consulting firm. Active lifestyle, loves meeting people.",
    },
    {
      id: 202,
      name: "David Park",
      university: "TMU",
      term: "Summer 2025",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face&q=80",
      match: 89,
      lifestyleTags: ["Fitness lover", "Social butterfly", "Non-smoker"],
      bio: "Software engineering co-op. Gym 4x a week, very social but respectful of space.",
    },
  ],
  3: [
    {
      id: 301,
      name: "Emma Wilson",
      university: "OCAD University",
      term: "Summer 2025",
      avatar:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face&q=80",
      match: 90,
      lifestyleTags: ["Night owl", "Social butterfly", "Gamer"],
      bio: "Design student interning at a studio. Night person, but quiet and respectful.",
    },
  ],
};

export const CONVERSATIONS: Record<string, Message[]> = {
  "1-101": [
    {
      id: 1,
      senderId: 101,
      text: "Hi! I love the listing. Would it be possible to see the unit?",
      timestamp: "2:14 PM",
      type: "text",
    },
    {
      id: 2,
      senderId: "landlord",
      text: "Hey Aisha! Thanks for reaching out. I'd be happy to set up a virtual tour.",
      timestamp: "2:31 PM",
      type: "text",
    },
  ],
  "2-201": [
    {
      id: 1,
      senderId: 201,
      text: "Is parking included?",
      timestamp: "Yesterday",
      type: "text",
    },
  ],
};
```

### Step 2: Verify the file compiles

Run: `cd /Users/user/Desktop/Frontend/frontend && npx tsc --noEmit`
Expected: No errors related to `src/lib/landlord-mock.ts`

### Step 3: Commit

```bash
git add src/lib/landlord-mock.ts
git commit -m "feat: add landlord dashboard mock data and types"
```

---

## Task 2: Shared Utility Components

**Files:**
- Create: `src/components/landlord/Reveal.tsx`
- Create: `src/components/landlord/StatCard.tsx`

### Step 1: Create Reveal component (reusable scroll animation)

```tsx
// src/components/landlord/Reveal.tsx
"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

export function Reveal({
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
```

### Step 2: Create StatCard component

```tsx
// src/components/landlord/StatCard.tsx
"use client";
import { motion } from "framer-motion";

export function StatCard({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={`rounded-2xl border p-5 flex items-center gap-4 ${
        highlight
          ? "bg-accent/5 border-accent/15"
          : "bg-surface border-warm-gray/10"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          highlight ? "bg-accent/10" : "bg-warm-gray/8"
        }`}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground tracking-tight">
          {value}
        </p>
        <p className="text-xs text-muted mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}
```

### Step 3: Commit

```bash
git add src/components/landlord/Reveal.tsx src/components/landlord/StatCard.tsx
git commit -m "feat: add landlord shared utility components"
```

---

## Task 3: Listing Card Component

**Files:**
- Create: `src/components/landlord/LandlordListingCard.tsx`

### Step 1: Create the listing card

```tsx
// src/components/landlord/LandlordListingCard.tsx
"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { Listing, ListingStatus } from "@/lib/landlord-mock";

const STATUS_STYLES: Record<ListingStatus, string> = {
  active: "bg-sage/10 text-sage border-sage/20",
  paused: "bg-warm-gray/10 text-muted border-warm-gray/20",
  filled: "bg-accent/10 text-accent border-accent/20",
};

const STATUS_LABELS: Record<ListingStatus, string> = {
  active: "Active",
  paused: "Paused",
  filled: "Filled",
};

export function LandlordListingCard({ listing }: { listing: Listing }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
      className="group relative rounded-2xl overflow-hidden bg-surface border border-warm-gray/10"
    >
      {/* Image */}
      <div className="relative h-[200px] overflow-hidden">
        <motion.img
          src={listing.image}
          alt={listing.title}
          className="w-full h-full object-cover"
          whileHover={{ scale: 1.06 }}
          transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {/* Status badge */}
        <div
          className={`absolute top-4 left-4 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
            STATUS_STYLES[listing.status]
          }`}
        >
          {STATUS_LABELS[listing.status]}
        </div>

        {/* 3-dot menu */}
        <div className="absolute top-3 right-3">
          <button
            onClick={(e) => {
              e.preventDefault();
              setMenuOpen((v) => !v);
            }}
            className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm cursor-pointer hover:bg-white transition-colors"
          >
            <svg
              className="w-4 h-4 text-foreground/60"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-10 bg-white rounded-xl shadow-lg border border-warm-gray/10 py-1 w-36 z-20"
              >
                {["Edit", "Pause", "Delete"].map((action) => (
                  <button
                    key={action}
                    onClick={(e) => {
                      e.preventDefault();
                      setMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      action === "Delete"
                        ? "text-red-500 hover:bg-red-50"
                        : "text-foreground hover:bg-warm-gray/8"
                    }`}
                  >
                    {action}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-5">
        <h3 className="font-semibold text-foreground text-[15px] leading-tight group-hover:text-accent transition-colors">
          {listing.title}
        </h3>
        <p className="text-muted text-xs mt-1">{listing.address}</p>

        {/* Stats row */}
        <div className="flex items-center gap-3 mt-3 text-[11px] text-muted">
          <span>{listing.matches} matches</span>
          <span className="w-1 h-1 rounded-full bg-warm-gray/30" />
          <span>{listing.views} views</span>
          <span className="w-1 h-1 rounded-full bg-warm-gray/30" />
          <span>{listing.inquiries} inquiries</span>
        </div>

        <p className="text-[11px] text-muted/70 mt-1">{listing.dates}</p>

        {/* CTA */}
        <Link
          href={`/landlord/dashboard/${listing.id}`}
          className="mt-4 block w-full py-2.5 rounded-xl text-xs font-semibold text-center text-foreground bg-warm-gray/8 hover:bg-warm-gray/15 transition-colors border border-warm-gray/10"
        >
          View matches
        </Link>
      </div>
    </motion.div>
  );
}
```

### Step 2: Commit

```bash
git add src/components/landlord/LandlordListingCard.tsx
git commit -m "feat: add landlord listing card component"
```

---

## Task 4: Dashboard Overview Page

**Files:**
- Create: `src/app/landlord/dashboard/page.tsx`

### Step 1: Create the overview page

```tsx
// src/app/landlord/dashboard/page.tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Building2, Users, MessageSquare, Video } from "lucide-react";
import { LANDLORD, LISTINGS } from "@/lib/landlord-mock";
import { LandlordListingCard } from "@/components/landlord/LandlordListingCard";
import { StatCard } from "@/components/landlord/StatCard";
import { Reveal } from "@/components/landlord/Reveal";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function LandlordDashboardPage() {
  const totalMatches = LISTINGS.reduce((sum, l) => sum + l.matches, 0);
  const activeListings = LISTINGS.filter((l) => l.status === "active").length;

  return (
    <div
      className="min-h-screen bg-background"
      style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
    >
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-warm-gray/10">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="text-foreground tracking-tight text-xl"
            style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
          >
            Sublet-Me
          </Link>
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="relative w-9 h-9 rounded-full bg-warm-gray/8 flex items-center justify-center hover:bg-warm-gray/15 transition-colors">
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
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-orange-400 flex items-center justify-center text-white font-semibold text-sm cursor-pointer ring-2 ring-background shadow-sm">
              {LANDLORD.name.charAt(0)}
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
            {getGreeting()}, {LANDLORD.name}
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
          </Reveal>
        </div>
      </section>

      {/* Footer */}
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
```

### Step 2: Verify in browser

Run: `npm run dev`
Navigate to: `http://localhost:3000/landlord/dashboard`
Expected: Dashboard overview with greeting, 4 stat cards, listing grid, add listing card.

### Step 3: Commit

```bash
git add src/app/landlord/dashboard/page.tsx
git commit -m "feat: add landlord dashboard overview page"
```

---

## Task 5: Chat Panel Component

**Files:**
- Create: `src/components/landlord/ChatPanel.tsx`

This must be built before the listing detail page since it's used there.

### Step 1: Create the slide-in chat panel

```tsx
// src/components/landlord/ChatPanel.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
}: {
  student: StudentMatch;
  listingId: number;
  onClose: () => void;
  onScheduleTour: () => void;
}) {
  const conversationKey = `${listingId}-${student.id}`;
  const [messages, setMessages] = useState<Message[]>(
    CONVERSATIONS[conversationKey] ?? []
  );
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
```

### Step 2: Commit

```bash
git add src/components/landlord/ChatPanel.tsx
git commit -m "feat: add landlord chat panel component"
```

---

## Task 6: Tour Scheduling Modal

**Files:**
- Create: `src/components/landlord/TourModal.tsx`

### Step 1: Create the modal

```tsx
// src/components/landlord/TourModal.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    <AnimatePresence>
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
              {validSlots.map((slot) => (
                <div
                  key={slot}
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
    </AnimatePresence>
  );
}
```

### Step 2: Commit

```bash
git add src/components/landlord/TourModal.tsx
git commit -m "feat: add tour scheduling modal component"
```

---

## Task 7: Student Match Card Component

**Files:**
- Create: `src/components/landlord/StudentMatchCard.tsx`

### Step 1: Create the card

```tsx
// src/components/landlord/StudentMatchCard.tsx
"use client";

import { motion } from "framer-motion";
import { MessageSquare, Video } from "lucide-react";
import type { StudentMatch } from "@/lib/landlord-mock";

export function StudentMatchCard({
  student,
  listingRequirementTags,
  onMessage,
  onScheduleTour,
}: {
  student: StudentMatch;
  listingRequirementTags: string[];
  onMessage: () => void;
  onScheduleTour: () => void;
}) {
  const sharedTags = student.lifestyleTags.filter((t) =>
    listingRequirementTags.includes(t)
  );

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25 }}
      className="bg-surface border border-warm-gray/10 rounded-2xl p-5 hover:border-warm-gray/25 transition-colors"
    >
      {/* Header */}
      <div className="flex items-start gap-3.5 mb-4">
        <div className="relative flex-shrink-0">
          <img
            src={student.avatar}
            alt={student.name}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-warm-gray/10"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-foreground text-sm">
                {student.name}
              </p>
              <p className="text-xs text-muted">{student.university}</p>
              <p className="text-[11px] text-muted/70">{student.term}</p>
            </div>
            {/* Match badge */}
            <div className="flex-shrink-0 flex flex-col items-center bg-accent/8 border border-accent/15 rounded-xl px-2.5 py-1.5">
              <span className="text-base font-bold text-accent leading-none">
                {student.match}%
              </span>
              <span className="text-[9px] text-accent/70 mt-0.5">match</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bio */}
      <p className="text-xs text-muted/80 mb-3 leading-relaxed">{student.bio}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {student.lifestyleTags.map((tag) => (
          <span
            key={tag}
            className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${
              sharedTags.includes(tag)
                ? "bg-accent/10 text-accent border border-accent/15"
                : "bg-warm-gray/10 text-muted/70"
            }`}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onMessage}
          className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-foreground bg-warm-gray/8 hover:bg-warm-gray/15 transition-colors border border-warm-gray/10 flex items-center justify-center gap-1.5"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Message
        </button>
        <button
          onClick={onScheduleTour}
          className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white bg-accent hover:bg-accent/90 transition-colors flex items-center justify-center gap-1.5 shadow-[0_4px_14px_rgba(232,93,74,0.25)]"
        >
          <Video className="w-3.5 h-3.5" />
          Schedule Tour
        </button>
      </div>
    </motion.div>
  );
}
```

### Step 2: Commit

```bash
git add src/components/landlord/StudentMatchCard.tsx
git commit -m "feat: add student match card component"
```

---

## Task 8: Requirements Panel Component

**Files:**
- Create: `src/components/landlord/RequirementsPanel.tsx`

### Step 1: Create the component

```tsx
// src/components/landlord/RequirementsPanel.tsx
"use client";

import { useState } from "react";
import { ChevronDown, Settings2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Requirements } from "@/lib/landlord-mock";

const GENDER_LABELS: Record<string, string> = {
  "no-preference": "No preference",
  male: "Male",
  female: "Female",
  "non-binary": "Non-binary",
};

const PET_LABELS: Record<string, string> = {
  "no-pets": "No pets",
  "pets-ok": "Pets OK",
};

export function RequirementsPanel({ requirements }: { requirements: Requirements }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-2xl border border-warm-gray/10 bg-surface overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-warm-gray/5 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Settings2 className="w-4 h-4 text-muted" />
          <span className="text-sm font-semibold text-foreground">
            Match requirements
          </span>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-muted" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.33, 1, 0.68, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1 flex flex-col gap-3 border-t border-warm-gray/8">
              <RequirementRow label="Budget">
                ${requirements.budgetMin} – ${requirements.budgetMax}/mo
              </RequirementRow>
              <RequirementRow label="Term">
                {requirements.termPreference}
              </RequirementRow>
              <RequirementRow label="Occupants">
                {requirements.occupants} person{requirements.occupants !== 1 ? "s" : ""}
              </RequirementRow>
              <RequirementRow label="Pets">
                {PET_LABELS[requirements.petPolicy]}
              </RequirementRow>
              <RequirementRow label="Gender">
                {GENDER_LABELS[requirements.genderPreference]}
              </RequirementRow>
              <RequirementRow label="References">
                {requirements.referencesRequired ? "Required" : "Not required"}
              </RequirementRow>
              <div>
                <p className="text-[11px] text-muted mb-2">Lifestyle tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {requirements.lifestyleTags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-accent/8 text-accent border border-accent/15 font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 pb-4">
              <button className="w-full py-2.5 rounded-xl text-xs font-semibold text-accent border border-accent/20 hover:bg-accent/5 transition-colors">
                Edit requirements
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RequirementRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-muted">{label}</span>
      <span className="text-[12px] font-medium text-foreground">{children}</span>
    </div>
  );
}
```

### Step 2: Commit

```bash
git add src/components/landlord/RequirementsPanel.tsx
git commit -m "feat: add requirements panel component"
```

---

## Task 9: Listing Detail Page

**Files:**
- Create: `src/app/landlord/dashboard/[listingId]/page.tsx`

### Step 1: Create the detail page

```tsx
// src/app/landlord/dashboard/[listingId]/page.tsx
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

  const [activeChat, setActiveChat] = useState<number | null>(null); // student id
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
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="text-foreground tracking-tight text-xl"
            style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
          >
            Sublet-Me
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

      {/* Chat panel */}
      <AnimatePresence>
        {activeStudent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/20"
              onClick={() => setActiveChat(null)}
            />
            <ChatPanel
              student={activeStudent}
              listingId={listing.id}
              onClose={() => setActiveChat(null)}
              onScheduleTour={() => {
                setTourStudentId(activeStudent.id);
              }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Tour modal */}
      <AnimatePresence>
        {tourStudent && (
          <TourModal
            studentName={tourStudent.name}
            onClose={() => setTourStudentId(null)}
            onConfirm={(slots) => handleConfirmTour(tourStudent.id, slots)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
```

### Step 2: Verify in browser

Navigate to: `http://localhost:3000/landlord/dashboard/1`
Expected:
- Left column: listing thumbnail + collapsible requirements panel
- Right column: matched student cards with match %, shared tags, Message + Schedule Tour buttons
- Clicking "Message" slides in the chat panel
- Clicking "Schedule Tour" opens the time slot modal

### Step 3: Commit

```bash
git add src/app/landlord/dashboard/[listingId]/page.tsx
git commit -m "feat: add listing detail page with matches, chat, and tour scheduling"
```

---

## Task 10: Type Check & Lint

### Step 1: Run TypeScript check

```bash
cd /Users/user/Desktop/Frontend/frontend && npx tsc --noEmit
```
Expected: No errors

### Step 2: Run lint

```bash
npm run lint
```
Expected: No errors

### Step 3: Commit any fixes

```bash
git add -A
git commit -m "fix: resolve type and lint issues in landlord dashboard"
```

---

## Done

At this point the landlord dashboard is fully implemented:
- `/landlord/dashboard` — overview with stats and listing grid
- `/landlord/dashboard/[listingId]` — listing detail with matched students, chat panel, and tour scheduling modal
