"use client";

import { useState, useRef, use } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────
type MatchReason = { label: string; matched: boolean; detail: string };
type Amenity = { label: string; icon: React.ReactNode };
type ExtendedListing = {
  id: number;
  title: string;
  address: string;
  price: number;
  dates: string;
  sqft: number;
  beds: number;
  baths: number;
  type: string;
  images: string[];
  host: {
    name: string;
    uni: string;
    avatar: string;
    bio: string;
    responseTime: string;
    tags: string[];
  };
  description: string;
  amenities: Amenity[];
  rules: string[];
  neighborhood: string;
  sharedTags: string[];
  match: number;
  matchReasons: MatchReason[];
};

// ─── Shared gallery images ────────────────────────────────────────────────────
const G = [
  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=450&fit=crop&q=80",
  "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=600&h=450&fit=crop&q=80",
  "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=450&fit=crop&q=80",
  "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&h=450&fit=crop&q=80",
];

function amenityIcon(type: string): React.ReactNode {
  const icons: Record<string, React.ReactNode> = {
    wifi: <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />,
    furnished: <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />,
    laundry: <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />,
    kitchen: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.125-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265zm-3 0a.375.375 0 11-.53 0L9 2.845l.265.265zm6 0a.375.375 0 11-.53 0L15 2.845l.265.265z" />,
    ac: <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />,
    gym: <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v9h-.75V6.75zm9.75 0h.75v9h-.75V6.75zM3 9.75h2.25v4.5H3v-4.5zm15.75 0H21v4.5h-2.25v-4.5z" />,
    parking: <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />,
    elevator: <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />,
  };
  return icons[type] ?? icons.wifi;
}

function makeAmenity(type: string, label: string): Amenity {
  return {
    label,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        {amenityIcon(type)}
      </svg>
    ),
  };
}

// ─── Extended Listing Data ────────────────────────────────────────────────────
const LISTINGS: Record<number, ExtendedListing> = {
  1: {
    id: 1,
    title: "Sunny Studio in Liberty Village",
    address: "45 Liberty St, Toronto, ON",
    price: 850,
    dates: "May 1 – Aug 31",
    sqft: 480,
    beds: 1,
    baths: 1,
    type: "Studio",
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1400&h=900&fit=crop&q=85",
      ...G,
    ],
    host: {
      name: "Alex Chen",
      uni: "University of Toronto",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop&crop=face&q=80",
      bio: "3rd-year CS student heading to Shopify in Ottawa for the summer. Kept the place super clean, all appliances in perfect shape. Happy to do a video tour anytime!",
      responseTime: "Responds within 2 hours",
      tags: ["Night owl", "Neat freak", "Fitness lover"],
    },
    description: "Sun-drenched studio steps from Liberty Village's best cafés and the GO Train. Floor-to-ceiling south-facing windows flood the space with light all afternoon. Fully furnished with a queen bed, desk, and sectional — move in with just your suitcase.",
    amenities: [
      makeAmenity("wifi", "High-speed WiFi"),
      makeAmenity("furnished", "Fully furnished"),
      makeAmenity("laundry", "In-suite laundry"),
      makeAmenity("kitchen", "Full kitchen"),
      makeAmenity("ac", "Central A/C"),
      makeAmenity("gym", "Building gym"),
    ],
    rules: ["No smoking indoors", "No overnight guests beyond 2 weeks", "Quiet hours after midnight"],
    neighborhood: "Liberty Village — walkable to King St nightlife, Lakeshore trails, and the Exhibition GO stop. Grocery and coffee shops on every corner.",
    sharedTags: ["Night owl"],
    match: 94,
    matchReasons: [
      { label: "Budget", matched: true, detail: "$850 — $50 under your $900 limit" },
      { label: "Dates", matched: true, detail: "May 1 – Aug 31 — exact Summer 2025 match" },
      { label: "Night owl", matched: true, detail: "Alex keeps the same late schedule" },
      { label: "Social butterfly", matched: false, detail: "Not listed by host" },
      { label: "Fitness lover", matched: true, detail: "Building gym included" },
    ],
  },
  2: {
    id: 2,
    title: "Modern 1BR near King West",
    address: "220 King St W, Toronto, ON",
    price: 875,
    dates: "May 1 – Aug 31",
    sqft: 560,
    beds: 1,
    baths: 1,
    type: "Apartment",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1400&h=900&fit=crop&q=85",
      ...G,
    ],
    host: {
      name: "Sarah Kim",
      uni: "Toronto Metropolitan University",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face&q=80",
      bio: "Software engineering intern at RBC this summer — subletting my 1BR while I'm away. The building has a rooftop deck and gym. Great spot for someone who likes running — High Park is 10 mins away.",
      responseTime: "Responds within 4 hours",
      tags: ["Early bird", "Fitness lover", "Neat freak"],
    },
    description: "Contemporary one-bedroom in the heart of King West. Freshly renovated kitchen, exposed concrete accents, and a private balcony overlooking the city. Everything you need is already here.",
    amenities: [
      makeAmenity("wifi", "High-speed WiFi"),
      makeAmenity("furnished", "Fully furnished"),
      makeAmenity("gym", "Rooftop gym + deck"),
      makeAmenity("kitchen", "Renovated kitchen"),
      makeAmenity("ac", "Central A/C"),
      makeAmenity("elevator", "Concierge building"),
    ],
    rules: ["No smoking", "No pets", "Quiet hours after 11pm"],
    neighborhood: "King West — Toronto's most walkable neighbourhood. Steps from TIFF, top restaurants, and the PATH. Streetcar to downtown in 8 minutes.",
    sharedTags: ["Fitness lover"],
    match: 91,
    matchReasons: [
      { label: "Budget", matched: true, detail: "$875 — $25 under your $900 limit" },
      { label: "Dates", matched: true, detail: "May 1 – Aug 31 — perfect Summer 2025 match" },
      { label: "Fitness lover", matched: true, detail: "Rooftop gym + High Park nearby" },
      { label: "Night owl", matched: false, detail: "Sarah is an early bird — opposite schedule" },
      { label: "Social butterfly", matched: false, detail: "Not listed by host" },
    ],
  },
  3: {
    id: 3,
    title: "Cozy Room in Shared House",
    address: "88 Brunswick Ave, Annex, Toronto",
    price: 650,
    dates: "May 1 – Aug 28",
    sqft: 200,
    beds: 1,
    baths: 1,
    type: "Room",
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1400&h=900&fit=crop&q=85",
      ...G,
    ],
    host: {
      name: "Marcus Johnson",
      uni: "York University",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face&q=80",
      bio: "2nd-year film student subletting my room in a 4-bedroom Victorian. Three housemates staying for summer — super social house, frequent dinner parties and game nights.",
      responseTime: "Responds within 6 hours",
      tags: ["Social butterfly", "Night owl", "Pet friendly"],
    },
    description: "Private furnished room in a beautiful century Victorian on one of the Annex's best tree-lined streets. Shared kitchen, living room, and backyard. Tight-knit housemate community — expect spontaneous nights out.",
    amenities: [
      makeAmenity("wifi", "High-speed WiFi"),
      makeAmenity("furnished", "Furnished room"),
      makeAmenity("laundry", "Shared laundry"),
      makeAmenity("kitchen", "Shared kitchen"),
      makeAmenity("parking", "Street parking"),
    ],
    rules: ["Pets allowed (case by case)", "Common areas cleaned weekly", "Visitors welcome"],
    neighborhood: "The Annex — steps from Bloor St's best bookshops, coffee, and the subway. U of T campus and Kensington Market both walkable.",
    sharedTags: ["Social butterfly"],
    match: 89,
    matchReasons: [
      { label: "Budget", matched: true, detail: "$650 — $250 under your $900 limit" },
      { label: "Dates", matched: true, detail: "May 1 – Aug 28 — close Summer 2025 match" },
      { label: "Social butterfly", matched: true, detail: "Active house with regular hangouts" },
      { label: "Night owl", matched: true, detail: "Marcus keeps late hours too" },
      { label: "Fitness lover", matched: false, detail: "No gym access listed" },
    ],
  },
  4: {
    id: 4,
    title: "Bright Loft in Distillery District",
    address: "15 Mill St, Distillery District, Toronto",
    price: 920,
    dates: "May 5 – Aug 31",
    sqft: 720,
    beds: 1,
    baths: 1,
    type: "Loft",
    images: [
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1400&h=900&fit=crop&q=85",
      ...G,
    ],
    host: {
      name: "Priya Patel",
      uni: "University of Toronto",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face&q=80",
      bio: "Engineering student doing an internship in San Francisco. This converted warehouse loft is my favourite place in the city — 12-foot ceilings, exposed brick, and the best neighbourhood in Toronto.",
      responseTime: "Responds within 1 hour",
      tags: ["Night owl", "Fitness lover", "Neat freak"],
    },
    description: "Jaw-dropping converted warehouse loft in the heart of the Distillery District. Exposed brick, 12-ft ceilings, original hardwood floors. One of Toronto's most iconic neighbourhoods — galleries, restaurants, and the waterfront trail all at your door.",
    amenities: [
      makeAmenity("wifi", "Gigabit WiFi"),
      makeAmenity("furnished", "Designer furnished"),
      makeAmenity("laundry", "In-suite laundry"),
      makeAmenity("kitchen", "Gourmet kitchen"),
      makeAmenity("ac", "Split A/C"),
      makeAmenity("gym", "Equinox nearby"),
      makeAmenity("parking", "Underground parking"),
    ],
    rules: ["No smoking", "No parties", "Treat the art pieces with care"],
    neighborhood: "Distillery District — cobblestone laneways, gallery openings, and the best brunch spots in the city. TTC streetcar to Union in 12 minutes.",
    sharedTags: ["Night owl", "Fitness lover"],
    match: 96,
    matchReasons: [
      { label: "Budget", matched: false, detail: "$920 — $20 over your $900 limit" },
      { label: "Dates", matched: true, detail: "May 5 – Aug 31 — near-perfect Summer 2025 match" },
      { label: "Night owl", matched: true, detail: "Priya keeps the same late schedule" },
      { label: "Social butterfly", matched: false, detail: "Not listed — quieter building" },
      { label: "Fitness lover", matched: true, detail: "Equinox one block away" },
    ],
  },
  5: {
    id: 5,
    title: "Furnished Room near Yonge & Eg",
    address: "2200 Yonge St, Toronto, ON",
    price: 780,
    dates: "May 1 – Aug 31",
    sqft: 250,
    beds: 1,
    baths: 1,
    type: "Room",
    images: [
      "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=1400&h=900&fit=crop&q=85",
      ...G,
    ],
    host: {
      name: "Jordan Lee",
      uni: "University of Toronto",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop&crop=face&q=80",
      bio: "3rd-year econ student away on exchange. Furnished private room in a quiet shared condo — one other roommate who works 9-5. Very chill environment.",
      responseTime: "Responds within 3 hours",
      tags: ["Night owl", "Neat freak"],
    },
    description: "Bright private room in a well-maintained midtown condo, steps from Yonge & Eglinton subway. Shared with one quiet roommate. Dedicated desk setup, blackout curtains, and super fast internet — great for someone who works late.",
    amenities: [
      makeAmenity("wifi", "High-speed WiFi"),
      makeAmenity("furnished", "Furnished room"),
      makeAmenity("laundry", "In-suite laundry"),
      makeAmenity("kitchen", "Full kitchen"),
      makeAmenity("ac", "Central A/C"),
      makeAmenity("gym", "Building gym"),
    ],
    rules: ["No smoking", "No overnight guests frequently", "Clean shared spaces daily"],
    neighborhood: "Yonge & Eglinton — the crossroads of midtown. Subway, shops, cinemas, and restaurants right outside. Quiet residential streets just one block in.",
    sharedTags: ["Night owl"],
    match: 87,
    matchReasons: [
      { label: "Budget", matched: true, detail: "$780 — $120 under your $900 limit" },
      { label: "Dates", matched: true, detail: "May 1 – Aug 31 — exact Summer 2025 match" },
      { label: "Night owl", matched: true, detail: "Jordan also works and studies late" },
      { label: "Social butterfly", matched: false, detail: "Quiet condo environment" },
      { label: "Fitness lover", matched: false, detail: "Building gym available but small" },
    ],
  },
  6: {
    id: 6,
    title: "Spacious 2BR in Kensington",
    address: "34 Kensington Ave, Toronto, ON",
    price: 700,
    dates: "May 1 – Aug 25",
    sqft: 850,
    beds: 2,
    baths: 1,
    type: "Apartment",
    images: [
      "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=1400&h=900&fit=crop&q=85",
      ...G,
    ],
    host: {
      name: "Emma Wilson",
      uni: "OCAD University",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=face&q=80",
      bio: "Design student spending the summer doing residency in Berlin. My apartment is colorful, creative, and full of life — the whole neighbourhood is. One room available, one other sublettor already confirmed.",
      responseTime: "Responds within 5 hours",
      tags: ["Social butterfly", "Early bird", "Pet friendly"],
    },
    description: "A rare gem: character two-bedroom above Kensington Market's best vintage shops. High ceilings, original hardwood, and a large shared kitchen with an actual dining table. One room available to sublet alongside another verified student.",
    amenities: [
      makeAmenity("wifi", "High-speed WiFi"),
      makeAmenity("furnished", "Partially furnished"),
      makeAmenity("laundry", "Coin laundry (basement)"),
      makeAmenity("kitchen", "Large shared kitchen"),
      makeAmenity("parking", "Bike storage"),
    ],
    rules: ["Pets welcome (small)", "Flexible on guests", "Keep kitchen clean"],
    neighborhood: "Kensington Market — one of Toronto's most vibrant pockets. Vintage stores, international food, live music, and Chinatown all within a 5-minute walk.",
    sharedTags: ["Social butterfly"],
    match: 85,
    matchReasons: [
      { label: "Budget", matched: true, detail: "$700 — $200 under your $900 limit" },
      { label: "Dates", matched: true, detail: "May 1 – Aug 25 — close Summer 2025 match" },
      { label: "Social butterfly", matched: true, detail: "Emma and neighbourhood are very social" },
      { label: "Night owl", matched: false, detail: "Emma is an early bird — different schedules" },
      { label: "Fitness lover", matched: false, detail: "No gym access" },
    ],
  },
  7: {
    id: 7,
    title: "Studio with CN Tower View",
    address: "10 Navy Wharf Ct, CityPlace, Toronto",
    price: 890,
    dates: "May 1 – Aug 31",
    sqft: 510,
    beds: 1,
    baths: 1,
    type: "Studio",
    images: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1400&h=900&fit=crop&q=85",
      ...G,
    ],
    host: {
      name: "David Park",
      uni: "Toronto Metropolitan University",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face&q=80",
      bio: "Data science student subletting for the summer. The CN Tower view from the 28th floor never gets old. Building has an incredible rooftop pool and two gyms.",
      responseTime: "Responds within 3 hours",
      tags: ["Fitness lover", "Neat freak", "Early bird"],
    },
    description: "High-floor studio with unobstructed CN Tower and lake views. Modern finishes, a Juliet balcony, and access to CityPlace's legendary amenities — rooftop pool, squash courts, and two fully-equipped gyms.",
    amenities: [
      makeAmenity("wifi", "High-speed WiFi"),
      makeAmenity("furnished", "Fully furnished"),
      makeAmenity("laundry", "In-suite laundry"),
      makeAmenity("kitchen", "Integrated kitchen"),
      makeAmenity("ac", "Central A/C"),
      makeAmenity("gym", "2 gyms + pool"),
      makeAmenity("elevator", "24/7 concierge"),
    ],
    rules: ["No smoking or vaping", "No parties", "Quiet hours after 10pm"],
    neighborhood: "CityPlace / Waterfront — lakeside trails, Harbourfront Centre, and Rogers Centre steps away. PATH underground to Union Station.",
    sharedTags: ["Fitness lover"],
    match: 90,
    matchReasons: [
      { label: "Budget", matched: true, detail: "$890 — $10 under your $900 limit" },
      { label: "Dates", matched: true, detail: "May 1 – Aug 31 — exact Summer 2025 match" },
      { label: "Fitness lover", matched: true, detail: "2 gyms + rooftop pool in building" },
      { label: "Night owl", matched: false, detail: "David is an early bird" },
      { label: "Social butterfly", matched: false, detail: "Quiet, professional building" },
    ],
  },
  8: {
    id: 8,
    title: "Charming Room in Leslieville",
    address: "1050 Queen St E, Leslieville, Toronto",
    price: 750,
    dates: "May 3 – Aug 30",
    sqft: 220,
    beds: 1,
    baths: 1,
    type: "Room",
    images: [
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1400&h=900&fit=crop&q=85",
      ...G,
    ],
    host: {
      name: "Maya Singh",
      uni: "University of Toronto",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face&q=80",
      bio: "Medical student away for clinical placements all summer. Beautiful semi-detached in Leslieville with a private backyard. Two other quiet, tidy housemates staying for the summer.",
      responseTime: "Responds within 8 hours",
      tags: ["Quiet & studious", "Neat freak", "Early bird"],
    },
    description: "Sun-filled private room in a character semi-detached on Queen East. Shared backyard for summer evenings, bright shared kitchen, and two wonderfully low-key housemates. Leslieville is one of Toronto's most charming and underrated neighbourhoods.",
    amenities: [
      makeAmenity("wifi", "High-speed WiFi"),
      makeAmenity("furnished", "Furnished room"),
      makeAmenity("laundry", "In-unit washer/dryer"),
      makeAmenity("kitchen", "Full kitchen"),
      makeAmenity("parking", "Private backyard"),
    ],
    rules: ["Quiet hours after 10pm", "No smoking", "Respectful of shared spaces"],
    neighborhood: "Leslieville — East Toronto's coolest neighbourhood. Indie coffee shops, farm-to-table restaurants, and the lake are all within walking distance.",
    sharedTags: [],
    match: 82,
    matchReasons: [
      { label: "Budget", matched: true, detail: "$750 — $150 under your $900 limit" },
      { label: "Dates", matched: true, detail: "May 3 – Aug 30 — close Summer 2025 match" },
      { label: "Night owl", matched: false, detail: "Quiet house, early schedule" },
      { label: "Social butterfly", matched: false, detail: "Low-key housemate environment" },
      { label: "Fitness lover", matched: false, detail: "No gym access listed" },
    ],
  },
};

// ─── Match Score Ring ─────────────────────────────────────────────────────────
function MatchRing({ score }: { score: number }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const containerRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<SVGCircleElement>(null);
  const inView = useInView(containerRef, { once: true });

  return (
    <div ref={containerRef} className="relative w-[100px] h-[100px] flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="7" />
        <motion.circle
          ref={circleRef}
          cx="48"
          cy="48"
          r={r}
          fill="none"
          stroke="#E85D4A"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: inView ? offset : circ }}
          transition={{ duration: 1.3, delay: 0.4, ease: [0.33, 1, 0.68, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-xl font-bold text-foreground leading-none"
          style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
        >
          {score}%
        </span>
        <span className="text-[10px] text-muted uppercase tracking-widest mt-0.5">match</span>
      </div>
    </div>
  );
}

// ─── Request Tour Button ──────────────────────────────────────────────────────
function TourButton({ listing }: { listing: ExtendedListing }) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  const handleClick = () => {
    if (state !== "idle") return;
    setState("loading");
    setTimeout(() => setState("done"), 1800);
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={state === "loading"}
      whileHover={state === "idle" ? { scale: 1.02 } : {}}
      whileTap={state === "idle" ? { scale: 0.98 } : {}}
      className={`w-full py-4 rounded-2xl font-semibold text-base transition-all duration-500 cursor-pointer relative overflow-hidden ${
        state === "done"
          ? "bg-sage text-white"
          : "bg-accent text-white shadow-[0_8px_30px_rgba(232,93,74,0.3)] hover:shadow-[0_12px_40px_rgba(232,93,74,0.4)]"
      }`}
    >
      <motion.div
        animate={{ opacity: state === "idle" ? 1 : 0, y: state === "idle" ? 0 : -12 }}
        transition={{ duration: 0.2 }}
        className="flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
        </svg>
        Request a Virtual Tour
      </motion.div>

      {state === "loading" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <motion.div
            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      )}

      {state === "done" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute inset-0 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Tour Requested!
        </motion.div>
      )}
    </motion.button>
  );
}

// ─── Fade-in on scroll ────────────────────────────────────────────────────────
function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: idParam } = use(params);
  const id = parseInt(idParam, 10);
  const listing = LISTINGS[id];
  const [saved, setSaved] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.3]);

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted mb-4">Listing not found.</p>
          <Link href="/dashboard" className="text-accent underline">Back to matches</Link>
        </div>
      </div>
    );
  }

  const others = Object.values(LISTINGS)
    .filter((l) => l.id !== listing.id)
    .sort((a, b) => b.match - a.match)
    .slice(0, 3);

  const totalMonths = 4;
  const total = listing.price * totalMonths;

  return (
    <div
      className="min-h-screen bg-background"
      style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
    >
      {/* ── Sticky nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-warm-gray/10 h-16 flex items-center px-6 lg:px-10 justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground transition-colors cursor-pointer group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          All matches
        </button>
        <Link
          href="/"
          className="text-foreground tracking-tight text-xl"
          style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
        >
          Sublet-Me
        </Link>
        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => setSaved((s) => !s)}
            whileTap={{ scale: 0.88 }}
            className="flex items-center gap-1.5 text-sm font-medium cursor-pointer text-muted hover:text-foreground transition-colors"
          >
            <svg
              className={`w-5 h-5 transition-all ${saved ? "text-accent fill-accent" : ""}`}
              viewBox="0 0 24 24"
              fill={saved ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            {saved ? "Saved" : "Save"}
          </motion.button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div ref={heroRef} className="relative h-[68vh] min-h-[480px] overflow-hidden pt-16">
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${listing.images[0]})`,
            scale: heroScale,
            opacity: heroOpacity,
          }}
        />
        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />

        {/* Bottom text */}
        <div className="absolute bottom-0 left-0 right-0 px-6 lg:px-12 pb-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Type + match badges */}
            <div className="flex items-center gap-2.5 mb-3 flex-wrap">
              <span className="bg-white/15 backdrop-blur-sm text-white/90 text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20">
                {listing.type}
              </span>
              <span className="bg-accent/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full">
                {listing.match}% match
              </span>
              {listing.sharedTags.map((t) => (
                <span key={t} className="bg-sage/80 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                  {t} match
                </span>
              ))}
            </div>
            <h1
              className="text-white text-3xl md:text-5xl lg:text-[3.5rem] tracking-tight leading-tight mb-2"
              style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
            >
              {listing.title}
            </h1>
            <p className="text-white/60 text-base">{listing.address}</p>
          </motion.div>
        </div>
      </div>

      {/* ── Photo gallery strip ── */}
      <FadeIn className="max-w-[1400px] mx-auto px-6 lg:px-12 mt-5">
        <div className="grid grid-cols-4 gap-2.5">
          {listing.images.slice(1, 5).map((img, i) => (
            <div key={i} className="aspect-[4/3] rounded-xl overflow-hidden">
              <motion.img
                src={img}
                alt=""
                className="w-full h-full object-cover"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.4 }}
              />
            </div>
          ))}
        </div>
      </FadeIn>

      {/* ── Main content ── */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12 xl:gap-16">

          {/* ── Left column ── */}
          <div className="space-y-12">

            {/* Key stats */}
            <FadeIn>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-10 border-b border-warm-gray/15">
                {[
                  { label: "Monthly rent", value: `$${listing.price}` },
                  { label: "Dates", value: listing.dates },
                  { label: "Type", value: `${listing.type} · ${listing.sqft} sqft` },
                  { label: "Beds / baths", value: `${listing.beds}bd / ${listing.baths}ba` },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[11px] uppercase tracking-widest text-muted/60 mb-1">{label}</p>
                    <p
                      className="text-foreground font-semibold text-[15px]"
                      style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </FadeIn>

            {/* Description */}
            <FadeIn>
              <h2
                className="text-2xl tracking-tight text-foreground mb-4"
                style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
              >
                About this space
              </h2>
              <p className="text-foreground/70 leading-relaxed text-base">{listing.description}</p>
              <p className="text-sm text-muted mt-4 leading-relaxed">{listing.neighborhood}</p>
            </FadeIn>

            {/* Amenities */}
            <FadeIn>
              <h2
                className="text-2xl tracking-tight text-foreground mb-5"
                style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
              >
                What&rsquo;s included
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {listing.amenities.map((a) => (
                  <div
                    key={a.label}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-surface border border-warm-gray/10"
                  >
                    <span className="text-foreground/50">{a.icon}</span>
                    <span className="text-sm font-medium text-foreground">{a.label}</span>
                  </div>
                ))}
              </div>
            </FadeIn>

            {/* Match breakdown */}
            <FadeIn>
              <div className="bg-surface rounded-2xl border border-warm-gray/10 p-7">
                <div className="flex items-center gap-5 mb-6">
                  <MatchRing score={listing.match} />
                  <div>
                    <h2
                      className="text-xl tracking-tight text-foreground mb-1"
                      style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
                    >
                      Why this works for you
                    </h2>
                    <p className="text-sm text-muted">Based on your profile and preferences</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {listing.matchReasons.map((r) => (
                    <div key={r.label} className="flex items-start gap-3">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          r.matched ? "bg-sage/20" : "bg-warm-gray/15"
                        }`}
                      >
                        {r.matched ? (
                          <svg className="w-3 h-3 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3 text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <span className={`text-sm font-semibold ${r.matched ? "text-foreground" : "text-muted/50"}`}>
                          {r.label}
                        </span>
                        <span className={`text-sm ml-2 ${r.matched ? "text-foreground/60" : "text-muted/40"}`}>
                          {r.detail}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            {/* Host */}
            <FadeIn>
              <h2
                className="text-2xl tracking-tight text-foreground mb-5"
                style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
              >
                Your host
              </h2>
              <div className="bg-surface rounded-2xl border border-warm-gray/10 p-7">
                <div className="flex items-start gap-4 mb-5">
                  <div className="relative flex-shrink-0">
                    <img
                      src={listing.host.avatar}
                      alt={listing.host.name}
                      className="w-16 h-16 rounded-full object-cover ring-2 ring-warm-gray/15"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-sage rounded-full border-2 border-surface flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className="text-lg text-foreground"
                        style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
                      >
                        {listing.host.name}
                      </h3>
                      <span className="text-xs text-muted bg-warm-gray/10 px-2.5 py-1 rounded-full">{listing.host.uni}</span>
                    </div>
                    <p className="text-xs text-sage font-medium mt-1">{listing.host.responseTime}</p>
                  </div>
                </div>
                <p className="text-foreground/65 text-sm leading-relaxed mb-5">{listing.host.bio}</p>
                <div className="flex flex-wrap gap-2">
                  {listing.host.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full ${
                        listing.sharedTags.includes(tag)
                          ? "bg-accent/8 text-accent border border-accent/15"
                          : "bg-warm-gray/10 text-muted"
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </FadeIn>

            {/* Rules */}
            <FadeIn>
              <h2
                className="text-2xl tracking-tight text-foreground mb-5"
                style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
              >
                House rules
              </h2>
              <div className="space-y-3">
                {listing.rules.map((rule) => (
                  <div key={rule} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-warm-gray/50 flex-shrink-0" />
                    <p className="text-foreground/70 text-sm">{rule}</p>
                  </div>
                ))}
              </div>
            </FadeIn>

          </div>

          {/* ── Right: sticky pricing card ── */}
          <div>
            <div className="sticky top-24 space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="bg-surface rounded-2xl border border-warm-gray/15 overflow-hidden shadow-[0_16px_50px_-12px_rgba(0,0,0,0.08)]"
              >
                {/* Price header */}
                <div className="px-7 pt-7 pb-5 border-b border-warm-gray/10">
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span
                      className="text-4xl font-bold text-foreground"
                      style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
                    >
                      ${listing.price}
                    </span>
                    <span className="text-muted text-sm">/month</span>
                  </div>
                  <p className="text-muted text-sm">{listing.dates}</p>
                </div>

                {/* Breakdown */}
                <div className="px-7 py-5 border-b border-warm-gray/10 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Monthly rent</span>
                    <span className="font-medium text-foreground">${listing.price}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Duration</span>
                    <span className="font-medium text-foreground">{totalMonths} months</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Utilities</span>
                    <span className="font-medium text-foreground">Negotiable</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-warm-gray/10">
                    <span className="text-foreground font-semibold">Total estimate</span>
                    <span className="font-bold text-foreground">~${total.toLocaleString()}</span>
                  </div>
                </div>

                {/* CTAs */}
                <div className="px-7 py-6 space-y-3">
                  <TourButton listing={listing} />
                  <button className="w-full py-3.5 rounded-2xl font-semibold text-sm text-foreground bg-warm-gray/8 hover:bg-warm-gray/15 transition-colors cursor-pointer border border-warm-gray/15">
                    Send a message
                  </button>
                </div>

                {/* Trust badges */}
                <div className="px-7 pb-6 space-y-2">
                  {[
                    "Verified student host",
                    "End-to-end encrypted calls",
                    "No hidden fees",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-sage/15 flex items-center justify-center flex-shrink-0">
                        <svg className="w-2.5 h-2.5 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-xs text-muted">{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Report listing */}
              <p className="text-center text-xs text-muted/40 cursor-pointer hover:text-muted/60 transition-colors">
                Report this listing
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Similar listings ── */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-12 pt-4 pb-20">
        <FadeIn className="mb-7">
          <h2
            className="text-2xl tracking-tight text-foreground"
            style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
          >
            You might also like
          </h2>
        </FadeIn>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {others.map((l, i) => (
            <FadeIn key={l.id} delay={i * 0.07}>
              <Link href={`/listings/${l.id}`}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.3 }}
                  className="group rounded-2xl overflow-hidden bg-surface border border-warm-gray/10 cursor-pointer hover:border-warm-gray/20 transition-colors"
                >
                  <div className="h-[200px] overflow-hidden">
                    <motion.img
                      src={l.images[0]}
                      alt={l.title}
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.06 }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-foreground text-[15px] leading-tight group-hover:text-accent transition-colors">
                        {l.title}
                      </h3>
                      <span className="text-xs font-bold text-accent flex-shrink-0">{l.match}%</span>
                    </div>
                    <p className="text-muted text-xs">{l.address}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm font-bold text-foreground">${l.price}<span className="text-xs text-muted font-normal">/mo</span></span>
                      <span className="text-xs text-muted">{l.dates}</span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-warm-gray/10 py-8">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex items-center justify-between">
          <span
            className="text-muted/40 text-sm"
            style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
          >
            Sublet-Me
          </span>
          <span className="text-muted/30 text-xs">Verified student housing for Canadian co-ops</span>
        </div>
      </footer>
    </div>
  );
}
