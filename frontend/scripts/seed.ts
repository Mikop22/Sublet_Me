/**
 * Seed script — populates MongoDB with demo data.
 * 5 hosts · 7 tenants · 41 Toronto listings, seeded matches, conversations, and tours
 *
 * Usage: npx tsx scripts/seed.ts   (or: npm run seed)
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import mongoose from "mongoose";
import { User } from "../src/models/User";
import { Listing } from "../src/models/Listing";
import { Conversation } from "../src/models/Conversation";
import { Match } from "../src/models/Match";
import { Tour } from "../src/models/Tour";

/** Build Unsplash photo URLs from photo IDs */
function imgs(...ids: string[]): string[] {
  return ids.map(
    (id) =>
      `https://images.unsplash.com/photo-${id}?w=1400&h=900&fit=crop&q=85`
  );
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function daysFromNow(days: number, hour: number, minute = 0): Date {
  const slot = new Date();
  slot.setDate(slot.getDate() + days);
  slot.setHours(hour, minute, 0, 0);
  return slot;
}

// ── Reusable date ranges ──────────────────────────────────────────────────────
const MAY_AUG  = { start: new Date("2025-05-01"), end: new Date("2025-08-31") };
const MAY_SEP  = { start: new Date("2025-05-01"), end: new Date("2025-09-30") };
const MAY_LATE = { start: new Date("2025-05-01"), end: new Date("2025-08-28") };
const MID_MAY  = { start: new Date("2025-05-15"), end: new Date("2025-08-31") };
const JUNE_AUG = { start: new Date("2025-06-01"), end: new Date("2025-08-31") };

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI — create .env.local first");
  process.exit(1);
}

async function seed() {
  console.log("Connecting to MongoDB…");
  await mongoose.connect(MONGODB_URI!);
  console.log("Connected.\n");

  // ── Wipe ─────────────────────────────────────────────────────────────────
  await Promise.all([
    User.deleteMany({}),
    Listing.deleteMany({}),
    Conversation.deleteMany({}),
    Match.deleteMany({}),
    Tour.deleteMany({}),
  ]);
  console.log("Cleared existing collections.");

  // ── Hosts ─────────────────────────────────────────────────────────────────
  const [jordan, alexHost, sarahHost, marcusHost, priyaHost] =
    await User.insertMany([
      {
        role: "host",
        name: "Jordan",
        email: "jordan@landlord.com",
        avatar: "",
        bio: "Property manager with multiple listings across Toronto. Quick responder, flexible with move-in dates.",
        university: "",
        lifestyleTags: [],
        responseTime: "Responds within 1 hour",
      },
      {
        role: "host",
        name: "Alex Chen",
        email: "alex.chen@utoronto.ca",
        avatar:
          "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop&crop=face&q=80",
        bio: "3rd-year CS student heading to Shopify in Ottawa for the summer.",
        university: "University of Toronto",
        lifestyleTags: ["Night owl", "Neat freak", "Fitness lover"],
        responseTime: "Responds within 2 hours",
      },
      {
        role: "host",
        name: "Sarah Kim",
        email: "sarah.kim@torontomu.ca",
        avatar:
          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face&q=80",
        bio: "Software engineering intern at RBC this summer — subletting my 1BR.",
        university: "Toronto Metropolitan University",
        lifestyleTags: ["Early bird", "Fitness lover", "Neat freak"],
        responseTime: "Responds within 4 hours",
      },
      {
        role: "host",
        name: "Marcus Johnson",
        email: "marcus.j@yorku.ca",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face&q=80",
        bio: "2nd-year film student subletting my room in a 4-bedroom Victorian.",
        university: "York University",
        lifestyleTags: ["Social butterfly", "Night owl", "Pet friendly"],
        responseTime: "Responds within 6 hours",
      },
      {
        role: "host",
        name: "Priya Patel",
        email: "priya.p@utoronto.ca",
        avatar:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face&q=80",
        bio: "UofT grad student subletting my loft in the Distillery District.",
        university: "University of Toronto",
        lifestyleTags: ["Fitness lover", "Night owl", "Yogi"],
        responseTime: "Responds within 3 hours",
      },
    ]);

  // ── Tenants ────────────────────────────────────────────────────────────
  const [aisha, chris, sophia] =
    await User.insertMany([
      {
        role: "tenant",
        name: "Aisha Rahman",
        email: "aisha.r@uwaterloo.ca",
        avatar:
          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face&q=80",
        bio: "3B Computer Science co-op. Looking for a quiet place to focus during my internship at a downtown tech company.",
        university: "University of Waterloo",
        lifestyleTags: ["Non-smoker", "Quiet & studious", "Early bird"],
        preferences: { city: "Toronto", term: "Summer 2025", budgetMax: 900 },
        freeText:
          "I like being close to good coffee shops and need reliable transit since I won't have a car.",
      },
      {
        role: "tenant",
        name: "Chris Taylor",
        email: "chris.t@mcmaster.ca",
        avatar:
          "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop&crop=face&q=80",
        bio: "Engineering student on my second co-op. Very tidy, respectful of shared spaces.",
        university: "McMaster University",
        lifestyleTags: ["Non-smoker", "Neat freak", "Fitness lover"],
        preferences: { city: "Toronto", term: "Summer 2025", budgetMax: 950 },
        freeText: "I go to the gym daily so a building gym or one nearby is a must.",
      },
      {
        role: "tenant",
        name: "Sophia Martinez",
        email: "sophia.m@mcgill.ca",
        avatar:
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face&q=80",
        bio: "Finance student interning at a Bay St firm. Early riser, very clean.",
        university: "McGill University",
        lifestyleTags: ["Non-smoker", "Yogi", "Plant parent"],
        preferences: { city: "Toronto", term: "Summer 2025", budgetMax: 900 },
      },
      {
        role: "tenant",
        name: "Tyler O'Brien",
        email: "tyler.ob@queensu.ca",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face&q=80",
        bio: "Commerce student on my first co-op rotation. Responsible, good references available.",
        university: "Queen's University",
        lifestyleTags: ["Non-smoker", "Quiet & studious", "Coffee addict"],
        preferences: { city: "Toronto", term: "Summer 2025", budgetMax: 850 },
      },
      {
        role: "tenant",
        name: "Maya Singh",
        email: "maya.s@utoronto.ca",
        avatar:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face&q=80",
        bio: "UofT Rotman MBA intern at a consulting firm. Active lifestyle, loves meeting people.",
        university: "University of Toronto",
        lifestyleTags: ["Fitness lover", "Social butterfly", "Foodie"],
        preferences: { city: "Toronto", term: "Summer 2025", budgetMax: 1200 },
        freeText:
          "I love trying new restaurants and being close to nightlife. Need walkable area.",
      },
      {
        role: "tenant",
        name: "David Park",
        email: "david.p@torontomu.ca",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face&q=80",
        bio: "Software engineering co-op. Gym 4x a week, very social but respectful of space.",
        university: "TMU",
        lifestyleTags: ["Fitness lover", "Social butterfly", "Non-smoker"],
        preferences: { city: "Toronto", term: "Summer 2025", budgetMax: 1100 },
      },
    {
        role: "tenant",
        name: "Emma Wilson",
        email: "emma.w@ocadu.ca",
        avatar:
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face&q=80",
        bio: "Design student interning at a studio. Night person, but quiet and respectful.",
        university: "OCAD University",
        lifestyleTags: ["Night owl", "Social butterfly", "Gamer"],
        preferences: { city: "Toronto", term: "Summer 2025", budgetMax: 700 },
      },
    ]);

  console.log("Created 5 hosts and 7 tenants.");

  // ── Listings ────────────────────────────────────────────────────────────
  const listings = await Listing.insertMany([
    // ═══════════════════════════════════════════════════════════════
    // JORDAN — flagship listing
    // ═══════════════════════════════════════════════════════════════
    {
      hostId: jordan._id,
      title: "Sunlit Studio — Financial District",
      address: "100 Adelaide St W, Toronto, ON",
      city: "Toronto",
      price: 995,
      dates: MAY_AUG,
      sqft: 420,
      beds: 1,
      baths: 1,
      type: "Studio",
      status: "active",
      images: imgs(
        "1502672260266-1c1ef2d93688",
        "1556909114-44e3e9399b79",
        "1554995207-c18c203602cb"
      ),
      description: "Bright, fully furnished studio in the heart of downtown Toronto with floor-to-ceiling windows, a dedicated work setup, in-suite laundry, and quick access to Bay Street offices, Union Station, and the PATH. Built for a co-op student or intern who wants a clean, quiet home base close to work and transit.",
      amenities: ["High-speed WiFi", "Fully furnished", "In-suite laundry", "Full kitchen", "Dedicated desk setup", "Central A/C", "Building gym", "24/7 concierge"],
      rules: ["No smoking", "No pets", "No parties", "Quiet hours after 11pm"],
      neighborhood: "Financial District — walk to Bay Street, Union Station, the PATH, groceries, cafes, and multiple TTC lines in minutes.",
      requirements: { budgetMin: 900, budgetMax: 1100, lifestyleTags: ["Non-smoker", "Quiet & studious", "Neat freak"], termPreference: "Summer 2025", petPolicy: "no-pets", genderPreference: "no-preference", occupants: 1, referencesRequired: true },
      stats: { views: 82, inquiries: 6 },
    },

    // ═══════════════════════════════════════════════════════════════
    // ALEX CHEN — 10 listings
    // ═══════════════════════════════════════════════════════════════
    {
      hostId: alexHost._id,
      title: "Compact Studio — Liberty Village",
      address: "60 Bathurst St, Toronto, ON",
      city: "Toronto",
      price: 850,
      dates: MAY_AUG,
      sqft: 400,
      beds: 1,
      baths: 1,
      type: "Studio",
      status: "active",
      images: imgs(
        "1570129477492-45c003edd2be",
        "1556909114-44e3e9399b79",
        "1554995207-c18c203602cb"
      ),
      description: "Efficient studio in a modern Liberty Village building. Murphy bed, full kitchen, and a dedicated desk. Great building gym and quick access to the lakefront bike path.",
      amenities: ["High-speed WiFi", "Fully furnished", "Full kitchen", "Central A/C", "Building gym", "Bike storage"],
      rules: ["No smoking", "No pets"],
      neighborhood: "Liberty Village — vibrant tech hub. Cafés, spin studios, and easy access to King St and the GO Train.",
      requirements: { budgetMin: 750, budgetMax: 950, lifestyleTags: ["Non-smoker", "Fitness lover"], termPreference: "Summer 2025", petPolicy: "no-pets", genderPreference: "no-preference", occupants: 1, referencesRequired: false },
      stats: { views: 59, inquiries: 4 },
    },
    {
      hostId: alexHost._id,
      title: "Open 1BR — College Street",
      address: "745 College St, Toronto, ON",
      city: "Toronto",
      price: 1100,
      dates: MAY_SEP,
      sqft: 550,
      beds: 1,
      baths: 1,
      type: "Apartment",
      status: "active",
      images: imgs(
        "1598928506311-c55ded91a20c",
        "1600210492493-0b9fc7f5c9d5",
        "1555041469-db61528b5b73",
        "1586023492125-27272f1d8b16"
      ),
      description: "Freshly renovated apartment in Little Italy with original hardwood floors and a brand-new kitchen. Steps from the best restaurants and cafés on College St.",
      amenities: ["High-speed WiFi", "Fully furnished", "Full kitchen", "In-suite laundry", "Central A/C", "Hardwood floors"],
      rules: ["No smoking", "No pets", "Quiet hours after 11pm"],
      neighborhood: "College Street / Little Italy — great food scene, indie bars, and a thriving arts community.",
      requirements: { budgetMin: 950, budgetMax: 1200, lifestyleTags: ["Non-smoker", "Foodie"], termPreference: "Summer 2025", petPolicy: "no-pets", genderPreference: "no-preference", occupants: 1, referencesRequired: false },
      stats: { views: 71, inquiries: 5 },
    },
    {
      hostId: alexHost._id,
      title: "Private Room — High Park",
      address: "22 Parkside Dr, Toronto, ON",
      city: "Toronto",
      price: 700,
      dates: MAY_AUG,
      sqft: 190,
      beds: 1,
      baths: 1,
      type: "Room",
      status: "active",
      images: imgs(
        "1560448204-e02f11c3d0e2",
        "1493663284031-b7e3aefcae9e",
        "1586023492125-27272f1d8b16"
      ),
      description: "Quiet private room in a house right next to High Park. Three other responsible tenants. Great for anyone who wants green space without paying downtown prices.",
      amenities: ["WiFi", "Furnished room", "Shared kitchen", "Shared backyard", "Laundry"],
      rules: ["No smoking", "No pets", "Quiet hours after 11pm"],
      neighborhood: "High Park — access to 400 acres of green space and a quick subway to downtown.",
      requirements: { budgetMin: 600, budgetMax: 800, lifestyleTags: ["Non-smoker", "Quiet & studious"], termPreference: "Summer 2025", petPolicy: "no-pets", genderPreference: "no-preference", occupants: 1, referencesRequired: false },
      stats: { views: 33, inquiries: 2 },
    },
    {
      hostId: alexHost._id,
      title: "Artist Loft — Leslieville",
      address: "990 Queen St E, Toronto, ON",
      city: "Toronto",
      price: 1200,
      dates: JUNE_AUG,
      sqft: 680,
      beds: 1,
      baths: 1,
      type: "Loft",
      status: "active",
      images: imgs(
        "1560185893-a55a2a1e7432",
        "1493809842364-78817add7ffb",
        "1502005097973-b820ceaf2ab3",
        "1598928506311-c55ded91a20c"
      ),
      description: "Wide-open loft above a gallery space in the heart of Leslieville. Polished concrete floors, track lighting, and walls you can actually hang art on.",
      amenities: ["High-speed WiFi", "Fully furnished", "Full kitchen", "In-suite laundry", "Central A/C", "Bike storage"],
      rules: ["No smoking", "Pets on approval", "No loud music after midnight"],
      neighborhood: "Leslieville — east-end gem. Queen East streetcar, great brunch scene, and a walkable weekend vibe.",
      requirements: { budgetMin: 1050, budgetMax: 1350, lifestyleTags: ["Social butterfly", "Night owl"], termPreference: "Summer 2025", petPolicy: "pets-ok", genderPreference: "no-preference", occupants: 1, referencesRequired: false },
      stats: { views: 49, inquiries: 3 },
    },
    {
      hostId: alexHost._id,
      title: "Minimalist Studio — Ossington",
      address: "174 Ossington Ave, Toronto, ON",
      city: "Toronto",
      price: 950,
      dates: MAY_AUG,
      sqft: 420,
      beds: 1,
      baths: 1,
      type: "Studio",
      status: "active",
      images: imgs(
        "1484101403633-562f891dc89a",
        "1600566753190-17f0baa2a6c3",
        "1556909114-44e3e9399b79"
      ),
      description: "Beautifully minimal studio on the Ossington strip. White oak finishes, Muji-inspired storage, and a proper chef's kitchen.",
      amenities: ["High-speed WiFi", "Fully furnished", "Full kitchen", "In-suite laundry", "Central A/C"],
      rules: ["No smoking", "No pets", "Quiet hours after midnight"],
      neighborhood: "Ossington — Toronto's trendiest strip. Natural wine bars, ramen spots, and record stores within a 3-minute walk.",
      requirements: { budgetMin: 850, budgetMax: 1050, lifestyleTags: ["Non-smoker", "Neat freak", "Foodie"], termPreference: "Summer 2025", petPolicy: "no-pets", genderPreference: "no-preference", occupants: 1, referencesRequired: false },
      stats: { views: 66, inquiries: 5 },
    },
    {
      hostId: alexHost._id,
      title: "Bright 1BR — Bloor West Village",
      address: "2190 Bloor St W, Toronto, ON",
      city: "Toronto",
      price: 1050,
      dates: MAY_AUG,
      sqft: 530,
      beds: 1,
      baths: 1,
      type: "Apartment",
      status: "active",
      images: imgs(
        "1522708323590-d24dbb6b0267",
        "1600585154526-990dced4db0d",
        "1554995207-c18c203602cb",
        "1600210492493-0b9fc7f5c9d5"
      ),
      description: "Charming one-bedroom with original crown moulding, bay windows, and a modern kitchen. High Park subway 7 min walk.",
      amenities: ["High-speed WiFi", "Fully furnished", "Full kitchen", "Laundry in building", "Central A/C", "Hardwood floors"],
      rules: ["No smoking", "Small pets welcome", "Quiet hours after 11pm"],
      neighborhood: "Bloor West Village — local shops, patios, and green space. Quick subway ride to downtown.",
      requirements: { budgetMin: 950, budgetMax: 1150, lifestyleTags: ["Non-smoker", "Plant parent"], termPreference: "Summer 2025", petPolicy: "pets-ok", genderPreference: "no-preference", occupants: 1, referencesRequired: false },
      stats: { views: 44, inquiries: 3 },
    },
    {
      hostId: alexHost._id,
      title: "Shared House Room — Parkdale",
      address: "65 Dufferin St, Toronto, ON",
      city: "Toronto",
      price: 650,
      dates: MAY_LATE,
      sqft: 180,
      beds: 1,
      baths: 1,
      type: "Room",
      status: "active",
      images: imgs(
        "1555041469-db61528b5b73",
        "1493663284031-b7e3aefcae9e",
        "1586023492125-27272f1d8b16"
      ),
      description: "Great-value private room in a 5-bedroom Victorian in Parkdale. Creative, social vibe — all tenants are students or young professionals. Large backyard and sunny living room.",
      amenities: ["WiFi", "Furnished room", "Shared kitchen", "Large backyard", "Laundry"],
      rules: ["No smoking inside", "Clean up after yourself"],
      neighborhood: "Parkdale — eclectic and up-and-coming. Tibetan restaurants, vintage stores, and the Exhibition grounds nearby.",
      requirements: { budgetMin: 550, budgetMax: 750, lifestyleTags: ["Social butterfly"], termPreference: "Summer 2025", petPolicy: "no-pets", genderPreference: "no-preference", occupants: 1, referencesRequired: false },
      stats: { views: 28, inquiries: 2 },
    },
    {
      hostId: alexHost._id,
      title: "Quiet Studio — Roncesvalles",
      address: "312 Roncesvalles Ave, Toronto, ON",
      city: "Toronto",
      price: 900,
      dates: MAY_AUG,
      sqft: 380,
      beds: 1,
      baths: 1,
      type: "Studio",
      status: "active",
      images: imgs(
        "1502672260266-1c1ef2d93688",
        "1554995207-c18c203602cb",
        "1556909114-44e3e9399b79"
      ),
      description: "Calm studio in Roncesvalles — a neighbourhood known for its strong community feel and amazing dining. Well-insulated and genuinely quiet. Queen West streetcar to downtown in under 20 min.",
      amenities: ["High-speed WiFi", "Fully furnished", "Full kitchen", "Central A/C", "Laundry in building"],
      rules: ["No smoking", "No pets"],
      neighborhood: "Roncesvalles — Polish-Canadian heritage, great bakeries, High Park at the south end.",
      requirements: { budgetMin: 800, budgetMax: 1000, lifestyleTags: ["Non-smoker", "Quiet & studious"], termPreference: "Summer 2025", petPolicy: "no-pets", genderPreference: "no-preference", occupants: 1, referencesRequired: false },
      stats: { views: 37, inquiries: 2 },
    },
    {
      hostId: alexHost._id,
      title: "Renovated 1BR — The Junction",
      address: "2898 Dundas St W, Toronto, ON",
      city: "Toronto",
      price: 1000,
      dates: MAY_SEP,
      sqft: 520,
      beds: 1,
      baths: 1,
      type: "Apartment",
      status: "active",
      images: imgs(
        "1584622650111-993a426fbf0a",
        "1600210492493-0b9fc7f5c9d5",
        "1600566753190-17f0baa2a6c3",
        "1586023492125-27272f1d8b16"
      ),
      description: "Top-floor apartment in a fully renovated Victorian in the Junction. Brand new kitchen, bathroom, and hardwood throughout. Best coffee-to-bar ratio in the city.",
      amenities: ["High-speed WiFi", "Fully furnished", "Full kitchen", "In-suite laundry", "Central A/C"],
      rules: ["No smoking", "Pets welcome", "Quiet hours after midnight"],
      neighborhood: "The Junction — one of Toronto's most creative pockets. Art galleries, cocktail bars, and record shops.",
      requirements: { budgetMin: 900, budgetMax: 1100, lifestyleTags: ["Social butterfly", "Foodie"], termPreference: "Summer 2025", petPolicy: "pets-ok", genderPreference: "no-preference", occupants: 1, referencesRequired: false },
      stats: { views: 52, inquiries: 4 },
    },
    {
      hostId: alexHost._id,
      title: "Converted Loft — Riverside",
      address: "88 River St, Toronto, ON",
      city: "Toronto",
      price: 1300,
      dates: JUNE_AUG,
      sqft: 720,
      beds: 1,
      baths: 1,
      type: "Loft",
      status: "active",
      images: imgs(
        "1493809842364-78817add7ffb",
        "1560185893-a55a2a1e7432",
        "1598928506311-c55ded91a20c",
        "1502005097973-b820ceaf2ab3"
      ),
      description: "Gorgeous loft conversion in Riverside — two full floors in a former printing building. Open living/dining/kitchen main floor; sleeping mezzanine with skylights upstairs.",
      amenities: ["High-speed WiFi", "Fully furnished", "Full kitchen", "In-suite laundry", "Central A/C", "Private patio", "Bike storage"],
      rules: ["No smoking", "No parties", "Pets on approval"],
      neighborhood: "Riverside / Corktown — boutique coffee, the Don Valley trail, and a quick streetcar to downtown.",
      requirements: { budgetMin: 1150, budgetMax: 1450, lifestyleTags: ["Non-smoker", "Neat freak"], termPreference: "Summer 2025", petPolicy: "pets-ok", genderPreference: "no-preference", occupants: 1, referencesRequired: true },
      stats: { views: 61, inquiries: 4 },
    },

    // ═══════════════════════════════════════════════════════════════
    // SARAH KIM — 10 listings
    // ═══════════════════════════════════════════════════════════════
    {
      hostId: sarahHost._id,
      title: "Premium 1BR — King West",
      address: "371 King St W, Toronto, ON",
      city: "Toronto",
      price: 1150,
      dates: MAY_AUG,
      sqft: 570,
      beds: 1,
      baths: 1,
      type: "Apartment",
      status: "active",
      images: imgs(
        "1522708323590-d24dbb6b0267",
        "1600573472550-8090733a21e0",
        "1584622650111-993a426fbf0a",
        "1555041469-db61528b5b73"
      ),
      description: "Impeccably maintained one-bedroom in a boutique King West building. White oak floors, Caesarstone kitchen, and a Juliet balcony overlooking a quiet laneway.",
      amenities: ["High-speed WiFi", "Fully furnished", "In-suite laundry", "Full kitchen", "Central A/C", "Concierge"],
      rules: ["No smoking", "No pets", "Quiet hours after 11pm"],
      neighborhood: "King West — Toronto's live-work-play neighbourhood. Everything within walking distance.",
      requirements: { budgetMin: 1000, budgetMax: 1250, lifestyleTags: ["Neat freak", "Non-smoker"], termPreference: "Summer 2025", petPolicy: "no-pets", genderPreference: "no-preference", occupants: 1, referencesRequired: true },
      stats: { views: 88, inquiries: 7 },
    },
    {
      hostId: sarahHost._id,
      title: "High-Floor Studio — Yorkville",
      address: "110 Bloor St W, Toronto, ON",
      city: "Toronto",
      price: 1250,
      dates: MID_MAY,
      sqft: 460,
      beds: 1,
      baths: 1,
      type: "Studio",
      status: "active",
      images: imgs(
        "1484101403633-562f891dc89a",
        "1558618666-fcd25c85cd64",
        "1600566753190-17f0baa2a6c3"
      ),
      description: "Jaw-dropping city views from the 31st floor. Professionally furnished studio steps from Holt Renfrew, the ROM, and Bloor-Yonge subway.",
      amenities: ["High-speed WiFi", "Fully furnished (professional)", "Full kitchen", "Central A/C", "Hotel-style amenities", "24h Concierge"],
      rules: ["No smoking", "No pets", "No parties"],
      neighborhood: "Yorkville — luxury shopping, fine dining, and gallery row. Bloor-Yonge subway 2 min.",
      requirements: { budgetMin: 1150, budgetMax: 1400, lifestyleTags: ["Non-smoker", "Neat freak"], termPreference: "Summer 2025", petPolicy: "no-pets", genderPreference: "no-preference", occupants: 1, referencesRequired: true },
      stats: { views: 72, inquiries: 5 },
    },
    {
      hostId: sarahHost._id,
      title: "Furnished Room — Forest Hill",
      address: "40 Old Orchard Grove, Toronto, ON",
      city: "Toronto",
      price: 800,
      dates: MAY_AUG,
      sqft: 210,
      beds: 1,
      baths: 1,
      type: "Room",
      status: "active",
      images: imgs(
        "1554995207-c18c203602cb",
        "1493663284031-b7e3aefcae9e",
        "1555041469-db61528b5b73"
      ),
      description: "Private room in a beautiful Forest Hill home. Spotless and calm — two other quiet grad students. Eglinton subway 5-minute walk.",
      amenities: ["WiFi", "Furnished room", "Shared modern kitchen", "Shared laundry", "Driveway parking"],
      rules: ["No smoking", "No pets", "Quiet hours after 10pm"],
      neighborhood: "Forest Hill — one of Toronto's most prestigious residential areas. Safe, green, and close to the Eglinton LRT.",
      requirements: { budgetMin: 700, budgetMax: 900, lifestyleTags: ["Non-smoker", "Quiet & studious", "Early bird"], termPreference: "Summer 2025", petPolicy: "no-pets", genderPreference: "no-preference", occupants: 1, referencesRequired: true },
      stats: { views: 41, inquiries: 3 },
    },
    {
      hostId: sarahHost._id,
      title: "Cozy 1BR — Midtown",
      address: "185 Davisville Ave, Toronto, ON",
      city: "Toronto",
      price: 1100,
      dates: MAY_SEP,
      sqft: 555,
      beds: 1,
      baths: 1,
      type: "Apartment",
      status: "active",
      images: imgs(
        "1598928506311-c55ded91a20c",
        "1600210492493-0b9fc7f5c9d5",
        "1554995207-c18c203602cb",
        "1600585154526-990dced4db0d"
      ),
      description: "Warm and well-appointed one-bedroom in a quiet midtown pocket. Dedicated home office corner, blackout blinds, and a surprisingly spacious kitchen. Davisville subway 8 min walk.",
      amenities: ["High-speed WiFi", "Fully furnished", "Full kitchen", "In-suite laundry", "Central A/C", "Storage locker"],
      rules: ["No smoking", "No pets", "Quiet hours after 11pm"],
      neighborhood: "Davisville / Midtown — quiet residential vibe with easy subway access to downtown and North York.",
      requirements: { budgetMin: 1000, budgetMax: 1200, lifestyleTags: ["Non-smoker", "Quiet & studious"], termPreference: "Summer 2025", petPolicy: "no-pets", genderPreference: "no-preference", occupants: 1, referencesRequired: false },
      stats: { views: 55, inquiries: 4 },
    },
    {
      hostId: sarahHost._id,
      title: "New Studio — Yonge & Eglinton",
      address: "2 Eglinton Ave E, Toronto, ON",
      city: "Toronto",
      price: 1000,
      dates: MAY_AUG,
      sqft: 430,
      beds: 1,
      baths: 1,
      type: "Studio",
      status: "active",
      images: imgs(
        "1502672260266-1c1ef2d93688",
        "1600573472550-8090733a21e0",
        "1556909114-44e3e9399b79"
      ),
      description: "Brand-new studio in a brand-new building at Yonge and Eglinton. Never-lived-in unit with every modern finish. Direct subway + future LRT access at the building entrance.",
      amenities: ["High-speed WiFi", "Fully furnished", "Full kitchen", "In-suite laundry", "Central A/C", "Concierge", "Rooftop terrace"],
      rules: ["No smoking", "No pets"],
      neighborhood: "Yonge & Eglinton — Toronto's second downtown. Dining, cinema, grocery, and transit all at street level.",
      requirements: { budgetMin: 900, budgetMax: 1100, lifestyleTags: ["Non-smoker"], termPreference: "Summer 2025", petPolicy: "no-pets", genderPreference: "no-preference", occupants: 1, referencesRequired: false },
      stats: { views: 63, inquiries: 5 },
    },
    {
      hostId: sarahHost._id,
      title: "Large Room — The Annex",
      address: "72 Spadina Rd, Toronto, ON",
      city: "Toronto",
      price: 750,
      dates: MAY_AUG,
      sqft: 230,
      beds: 1,
      baths: 1,
      type: "Room",
      status: "active",
      images: imgs(
        "1560448204-e02f11c3d0e2",
        "1586023492125-27272f1d8b16",
        "1555041469-db61528b5b73"
      ),
      description: "Generously sized room (by Toronto standards) in a well-maintained Annex house. Private entrance from the front porch. Three quiet grad student housemates.",
      amenities: ["WiFi", "Furnished room", "Shared kitchen", "Front porch", "Basement laundry"],
      rules: ["No smoking", "Quiet hours after 11pm"],
      neighborhood: "The Annex — literary cafés, bookshops, and U of T at your doorstep.",
      requirements: { budgetMin: 650, budgetMax: 850, lifestyleTags: ["Non-smoker", "Quiet & studious"], termPreference: "Summer 2025", petPolicy: "no-pets", genderPreference: "no-preference", occupants: 1, referencesRequired: false },
      stats: { views: 34, inquiries: 2 },
    },
    {
      hostId: sarahHost._id,
      title: "Modern 1BR — Corktown",
      address: "134 Eastern Ave, Toronto, ON",
      city: "Toronto",
      price: 1050,
      dates: JUNE_AUG,
      sqft: 510,
      beds: 1,
      baths: 1,
      type: "Apartment",
      status: "active",
      images: imgs(
        "1558618666-fcd25c85cd64",
        "1600210492493-0b9fc7f5c9d5",
        "1584622650111-993a426fbf0a",
        "1600585154526-990dced4db0d"
      ),
      description: "Sleek one-bedroom in a low-rise Corktown building with a great rooftop terrace. Open kitchen, heated bathroom floors, and blackout roller blinds.",
      amenities: ["High-speed WiFi", "Fully furnished", "Full kitchen", "In-suite laundry", "Central A/C", "Rooftop terrace", "Bike storage"],
      rules: ["No smoking", "Pets on approval", "Quiet hours after midnight"],
      neighborhood: "Corktown — up-and-coming east downtown. Artisan coffee, the Don trail, and a quick streetcar to the core.",
      requirements: { budgetMin: 950, budgetMax: 1150, lifestyleTags: ["Fitness lover", "Non-smoker"], termPreference: "Summer 2025", petPolicy: "pets-ok", genderPreference: "no-preference", occupants: 1, referencesRequired: false },
      stats: { views: 48, inquiries: 3 },
    },
    {
      hostId: sarahHost._id,
      title: "Charming Studio — Little Italy",
      address: "565 College St, Toronto, ON",
      city: "Toronto",
      price: 950,
      dates: MAY_LATE,
      sqft: 390,
      beds: 1,
      baths: 1,
      type: "Studio",
      status: "active",
      images: imgs(
        "1570129477492-45c003edd2be",
        "1556909114-44e3e9399b79",
        "1554995207-c18c203602cb"
      ),
      description: "Character studio above a beloved trattoria in the heart of Little Italy. Tin ceilings, wide plank floors, and exposed brick.",
      amenities: ["High-speed WiFi", "Fully furnished", "Full kitchen", "Central A/C", "Laundry in building"],
      rules: ["No smoking", "No pets", "No parties"],
      neighborhood: "Little Italy / College Street — one of Toronto's iconic dining corridors. Very walkable.",
      requirements: { budgetMin: 850, budgetMax: 1050, lifestyleTags: ["Foodie", "Social butterfly"], termPreference: "Summer 2025", petPolicy: "no-pets", genderPreference: "no-preference", occupants: 1, referencesRequired: false },
      stats: { views: 57, inquiries: 4 },
    },
    {
      hostId: sarahHost._id,
      title: "Waterfront 1BR — Harbourfront",
      address: "55 Harbour Sq, Toronto, ON",
      city: "Toronto",
      price: 1300,
      dates: MAY_AUG,
      sqft: 600,
      beds: 1,
      baths: 1,
      type: "Apartment",
      status: "active",
      images: imgs(
        "1598928506311-c55ded91a20c",
        "1600573472550-8090733a21e0",
        "1555041469-db61528b5b73",
        "1502005097973-b820ceaf2ab3"
      ),
      description: "Sweeping lake views from a full floor-to-ceiling wall of windows. This one-bedroom is directly on the waterfront. Includes one underground parking spot.",
      amenities: ["High-speed WiFi", "Fully furnished", "Full kitchen", "In-suite laundry", "Central A/C", "Concierge + security", "Underground parking", "Indoor pool"],
      rules: ["No smoking", "No pets", "No parties", "Quiet hours after 10pm"],
      neighborhood: "Harbourfront — direct access to the waterfront boardwalk, ferries to the islands, and Union Station.",
      requirements: { budgetMin: 1150, budgetMax: 1450, lifestyleTags: ["Non-smoker", "Fitness lover", "Early bird"], termPreference: "Summer 2025", petPolicy: "no-pets", genderPreference: "no-preference", occupants: 1, referencesRequired: true },
      stats: { views: 91, inquiries: 8 },
    },
    {
      hostId: sarahHost._id,
      title: "East End Room — Danforth",
      address: "890 Danforth Ave, Toronto, ON",
      city: "Toronto",
      price: 700,
      dates: MAY_SEP,
      sqft: 185,
      beds: 1,
      baths: 1,
      type: "Room",
      status: "active",
      images: imgs(
        "1560448204-e02f11c3d0e2",
        "1493663284031-b7e3aefcae9e",
        "1586023492125-27272f1d8b16"
      ),
      description: "Affordable private room in a friendly Greektown house. Excellent subway access — Pape station 5 min walk. The Danforth is known for its incredible restaurant scene.",
      amenities: ["WiFi", "Furnished room", "Shared kitchen", "Shared backyard", "Laundry"],
      rules: ["No smoking", "Quiet hours after 11pm"],
      neighborhood: "The Danforth / Greektown — lively dining scene, summer festivals, and the Pape subway stop.",
      requirements: { budgetMin: 600, budgetMax: 800, lifestyleTags: ["Non-smoker", "Foodie"], termPreference: "Summer 2025", petPolicy: "no-pets", genderPreference: "no-preference", occupants: 1, referencesRequired: false },
      stats: { views: 26, inquiries: 2 },
    },

    // ═══════════════════════════════════════════════════════════════
    // MARCUS JOHNSON — 10 listings
    // ═══════════════════════════════════════════════════════════════
    {
      hostId: marcusHost._id,
      title: "Victorian House Room — The Annex",
      address: "88 Brunswick Ave, Toronto, ON",
      city: "Toronto",
      price: 675,
      dates: MAY_LATE,
      sqft: 195,
      beds: 1,
      baths: 1,
      type: "Room",
      status: "active",
      images: imgs(
        "1555041469-db61528b5b73",
        "1493663284031-b7e3aefcae9e",
        "1586023492125-27272f1d8b16"
      ),
      description: "Private furnished room in a beautiful century Victorian on one of the Annex's best tree-lined streets. Original pocket doors, leaded glass, clawfoot tub.",
      amenities: ["WiFi", "Furnished room", "Shared kitchen", "Backyard", "Laundry in basement"],
      rules: ["No smoking inside", "Clean up after yourself"],
      neighborhood: "The Annex — steps from U of T, Bloor Street, and the best indie bookshops in the city.",
      requirements: { budgetMin: 600, budgetMax: 750, lifestyleTags: ["Night owl", "Social butterfly"], termPreference: "Summer 2025", petPolicy: "no-pets", genderPreference: "no-preference", occupants: 1, referencesRequired: false },
      stats: { views: 21, inquiries: 1 },
    },
    {
      hostId: marcusHost._id,
      title: "Bohemian Studio — Kensington Market",
      address: "184 Augusta Ave, Toronto, ON",
      city: "Toronto",
      price: 850,
      dates: MAY_AUG,
      sqft: 370,
      beds: 1,
      baths: 1,
      type: "Studio",
      status: "active",
      images: imgs(
        "1570129477492-45c003edd2be",
        "1598928506311-c55ded91a20c",
        "1554995207-c18c203602cb"
      ),
      description: "Artsy, eclectic studio above a vintage clothing shop in Kensington Market. Colourful tiles, exposed brick, vintage furnishings.",
      amenities: ["WiFi", "Fully furnished (vintage)", "Full kitchen", "Central A/C", "Bike storage"],
      rules: ["No smoking", "Pets on approval"],
      neighborhood: "Kensington Market — vintage shops, international street food, and the best jerk chicken in Toronto.",
      requirements: { budgetMin: 750, budgetMax: 950, lifestyleTags: ["Social butterfly", "Night owl"], termPreference: "Summer 2025", petPolicy: "pets-ok", genderPreference: "no-preference", occupants: 1, referencesRequired: false },
      stats: { views: 44, inquiries: 3 },
    },
    {
      hostId: marcusHost._id,
      title: "Greektown Room",
      address: "742 Danforth Ave, Toronto, ON",
      city: "Toronto",
      price: 700,
      dates: MAY_AUG,
      sqft: 180,
      beds: 1,
      baths: 1,
      type: "Room",
      status: "active",
      images: imgs(
        "1560448204-e02f11c3d0e2",
        "1586023492125-27272f1d8b16",
        "1493663284031-b7e3aefcae9e"
      ),
      description: "Straightforward private room in a no-frills Greektown house. Clean, everything works, and you're a short walk from the Pape subway stop and the whole Danforth dining scene.",
      amenities: ["WiFi", "Furnished room", "Shared kitchen", "Laundry", "Backyard"],
      rules: ["No smoking", "Quiet hours after midnight"],
      neighborhood: "Greektown — diverse food scene, lively summer patios, and quick subway to downtown.",
      requirements: { budgetMin: 600, budgetMax: 800, lifestyleTags: ["Non-smoker"], termPreference: "Summer 2025", petPolicy: "no-pets", genderPreference: "no-preference", occupants: 1, referencesRequired: false },
      stats: { views: 18, inquiries: 1 },
    },
    {
      hostId: marcusHost._id,
      title: "Affordable 1BR — East York",
      address: "550 Cosburn Ave, Toronto, ON",
      city: "Toronto",
      price: 950,
      dates: MAY_SEP,
      sqft: 500,
      beds: 1,
      baths: 1,
      type: "Apartment",
      status: "active",
      images: imgs(
        "1522708323590-d24dbb6b0267",
        "1600585154526-990dced4db0d",
        "1600210492493-0b9fc7f5c9d5",
        "1554995207-c18c203602cb"
      ),
      description: "Spacious and affordable one-bedroom in East York. Updated kitchen and bath, big bedroom, and a private balcony. DVP and subway both accessible.",
      amenities: ["High-speed WiFi", "Fully furnished", "Full kitchen", "Laundry in building", "Central A/C", "Balcony", "Parking available"],
      rules: ["No smoking", "Pets welcome", "Quiet hours after 11pm"],
      neighborhood: "East York — underrated and affordable. Quiet residential streets with easy access to the subway and DVP.",
      requirements: { budgetMin: 850, budgetMax: 1050, lifestyleTags: ["Non-smoker"], termPreference: "Summer 2025", petPolicy: "pets-ok", genderPreference: "no-preference", occupants: 1, referencesRequired: false },
      stats: { views: 32, inquiries: 2 },
    },
    {
      hostId: marcusHost._id,
      title: "Christie Pits Studio",
      address: "940 Bloor St W, Toronto, ON",
      city: "Toronto",
      price: 900,
      dates: MAY_AUG,
      sqft: 395,
      beds: 1,
      baths: 1,
      type: "Studio",
      status: "active",
      images: imgs(
        "1484101403633-562f891dc89a",
        "1556909114-44e3e9399b79",
        "1600566753190-17f0baa2a6c3"
      ),
      description: "Practical studio a block from Christie Pits park. Great bakeries, a weekend farmers market, and the Christie subway station directly out front.",
      amenities: ["High-speed WiFi", "Fully furnished", "Full kitchen", "Central A/C", "Laundry in building"],
      rules: ["No smoking", "Pets welcome"],
      neighborhood: "Christie Pits — family-friendly and affordable. Christie subway station at the door.",
      requirements: { budgetMin: 800, budgetMax: 1000, lifestyleTags: ["Non-smoker"], termPreference: "Summer 2025", petPolicy: "pets-ok", genderPreference: "no-preference", occupants: 1, referencesRequired: false },
      stats: { views: 29, inquiries: 2 },
    },
    {
      hostId: marcusHost._id,
      title: "High Park House Room",
      address: "15 Geoffrey St, Toronto, ON",
      city: "Toronto",
      price: 725,
      dates: MAY_LATE,
      sqft: 175,
      beds: 1,
      baths: 1,
      type: "Room",
      status: "active",
      images: imgs(
        "1555041469-db61528b5b73",
        "1493663284031-b7e3aefcae9e",
        "1560448204-e02f11c3d0e2"
      ),
      description: "Private room in an Edwardian house at the edge of High Park. Hardwood floors, high ceilings, and well-maintained shared spaces.",
      amenities: ["WiFi", "Furnished room", "Shared kitchen", "Backyard", "Laundry"],
      rules: ["No smoking", "No pets", "Quiet hours after 11pm"],
      neighborhood: "High Park — 400 acres of park at your doorstep. High Park subway 8 min walk.",
      requirements: { budgetMin: 625, budgetMax: 825, lifestyleTags: ["Non-smoker", "Fitness lover"], termPreference: "Summer 2025", petPolicy: "no-pets", genderPreference: "no-preference", occupants: 1, referencesRequired: false },
      stats: { views: 23, inquiries: 2 },
    },
    {
      hostId: marcusHost._id,
      title: "Scarborough 1BR",
      address: "2660 Lawrence Ave E, Toronto, ON",
      city: "Toronto",
      price: 875,
      dates: MAY_SEP,
      sqft: 540,
      beds: 1,
      baths: 1,
      type: "Apartment",
      status: "active",
      images: imgs(
        "1502672260266-1c1ef2d93688",
        "1600585154526-990dced4db0d",
        "1554995207-c18c203602cb",
        "1600210492493-0b9fc7f5c9d5"
      ),
      description: "Spacious one-bedroom in Scarborough — the best value-per-square-foot deal in the city. Close to Scarborough Town Centre and Kennedy subway station. Free parking included.",
      amenities: ["High-speed WiFi", "Fully furnished", "Full kitchen", "Laundry in building", "Central A/C", "Free parking"],
      rules: ["No smoking", "Pets welcome"],
      neighborhood: "Scarborough — great transit access via the RT, and surprisingly close to downtown by subway.",
      requirements: { budgetMin: 750, budgetMax: 975, lifestyleTags: ["Non-smoker"], termPreference: "Summer 2025", petPolicy: "pets-ok", genderPreference: "no-preference", occupants: 1, referencesRequired: false },
      stats: { views: 15, inquiries: 1 },
    },
    {
      hostId: marcusHost._id,
      title: "North York Studio",
      address: "4789 Yonge St, Toronto, ON",
      city: "Toronto",
      price: 825,
      dates: MAY_AUG,
      sqft: 380,
      beds: 1,
      baths: 1,
      type: "Studio",
      status: "active",
      images: imgs(
        "1570129477492-45c003edd2be",
        "1556909114-44e3e9399b79",
        "1554995207-c18c203602cb"
      ),
      description: "Clean and quiet studio in the North York City Centre corridor. Sheppard-Yonge subway 5-minute walk. Great value for the space.",
      amenities: ["High-speed WiFi", "Fully furnished", "Full kitchen", "Central A/C", "Laundry in building", "Visitor parking"],
      rules: ["No smoking", "No pets"],
      neighborhood: "North York — quieter pace with excellent transit. Sheppard-Yonge subway and North York Centre mall nearby.",
      requirements: { budgetMin: 725, budgetMax: 925, lifestyleTags: ["Non-smoker", "Quiet & studious"], termPreference: "Summer 2025", petPolicy: "no-pets", genderPreference: "no-preference", occupants: 1, referencesRequired: false },
      stats: { views: 19, inquiries: 1 },
    },
    {
      hostId: marcusHost._id,
      title: "Little Portugal Room",
      address: "1085 Dundas St W, Toronto, ON",
      city: "Toronto",
      price: 680,
      dates: MAY_AUG,
      sqft: 165,
      beds: 1,
      baths: 1,
      type: "Room",
      status: "active",
      images: imgs(
        "1560448204-e02f11c3d0e2",
        "1555041469-db61528b5b73",
        "1586023492125-27272f1d8b16"
      ),
      description: "Budget-friendly private room in the heart of Little Portugal / Dundas West. Portuguese bakeries, cool bars, and Trinity Bellwoods a quick walk away.",
      amenities: ["WiFi", "Furnished room", "Shared kitchen", "Laundry", "Backyard patio"],
      rules: ["No smoking inside"],
      neighborhood: "Little Portugal / Dundas West — Portuguese bakeries, trendy bars, and 10 min to Trinity Bellwoods.",
      requirements: { budgetMin: 575, budgetMax: 775, lifestyleTags: ["Social butterfly"], termPreference: "Summer 2025", petPolicy: "no-pets", genderPreference: "no-preference", occupants: 1, referencesRequired: false },
      stats: { views: 22, inquiries: 2 },
    },
    {
      hostId: marcusHost._id,
      title: "The Beach 1BR",
      address: "2196 Queen St E, Toronto, ON",
      city: "Toronto",
      price: 1100,
      dates: JUNE_AUG,
      sqft: 580,
      beds: 1,
      baths: 1,
      type: "Apartment",
      status: "active",
      images: imgs(
        "1598928506311-c55ded91a20c",
        "1600573472550-8090733a21e0",
        "1584622650111-993a426fbf0a",
        "1502005097973-b820ceaf2ab3"
      ),
      description: "Steps from the sandy Beach boardwalk. Morning runs by the lake, weekend markets on Queen East, and a neighbourhood with a true small-town feel.",
      amenities: ["High-speed WiFi", "Fully furnished", "Full kitchen", "In-suite laundry", "Central A/C", "Bike storage"],
      rules: ["No smoking", "Pets welcome", "Quiet hours after midnight"],
      neighborhood: "The Beach — lakeside community vibe. Boardwalk, tennis courts, and great fish and chips.",
      requirements: { budgetMin: 1000, budgetMax: 1200, lifestyleTags: ["Fitness lover", "Early bird"], termPreference: "Summer 2025", petPolicy: "pets-ok", genderPreference: "no-preference", occupants: 1, referencesRequired: false },
      stats: { views: 58, inquiries: 4 },
    },

    // ═══════════════════════════════════════════════════════════════
    // PRIYA PATEL — 10 listings
    // ═══════════════════════════════════════════════════════════════
    {
      hostId: priyaHost._id,
      title: "Exposed Brick Loft — Distillery",
      address: "55 Mill St, Toronto, ON",
      city: "Toronto",
      price: 1150,
      dates: MAY_AUG,
      sqft: 710,
      beds: 1,
      baths: 1,
      type: "Loft",
      status: "active",
      images: imgs(
        "1493809842364-78817add7ffb",
        "1560185893-a55a2a1e7432",
        "1598928506311-c55ded91a20c",
        "1502005097973-b820ceaf2ab3"
      ),
      description: "True Distillery loft with two walls of original exposed brick, 16-foot ceiling, and original wide-plank hemlock floors. Sleeping alcove screened by industrial shelving from the main living area.",
      amenities: ["High-speed WiFi", "Fully furnished", "Full kitchen", "In-suite laundry", "Rooftop access", "Bike storage"],
      rules: ["No smoking", "No parties", "Quiet hours after 11pm"],
      neighborhood: "Distillery District — cobblestone alleys, galleries, craft breweries, and the lakefront a 10-min walk.",
      requirements: { budgetMin: 1000, budgetMax: 1300, lifestyleTags: ["Neat freak", "Non-smoker"], termPreference: "Summer 2025", petPolicy: "no-pets", genderPreference: "no-preference", occupants: 1, referencesRequired: false },
      stats: { views: 77, inquiries: 6 },
    },
    {
      hostId: priyaHost._id,
      title: "Waterfront Studio",
      address: "300 Front St W, Toronto, ON",
      city: "Toronto",
      price: 1000,
      dates: MAY_AUG,
      sqft: 425,
      beds: 1,
      baths: 1,
      type: "Studio",
      status: "active",
      images: imgs(
        "1502672260266-1c1ef2d93688",
        "1556909114-44e3e9399b79",
        "1600566753190-17f0baa2a6c3"
      ),
      description: "Comfortable studio in a premium Waterfront-area tower. South-facing unit gets afternoon sun and a sliver of lake view. CN Tower visible from the balcony.",
      amenities: ["High-speed WiFi", "Fully furnished", "Full kitchen", "Central A/C", "Building gym + pool", "Concierge", "Balcony"],
      rules: ["No smoking", "No pets"],
      neighborhood: "Waterfront / City Place — lakefront living with fast access to the financial core and the Entertainment District.",
      requirements: { budgetMin: 900, budgetMax: 1100, lifestyleTags: ["Non-smoker", "Fitness lover"], termPreference: "Summer 2025", petPolicy: "no-pets", genderPreference: "no-preference", occupants: 1, referencesRequired: false },
      stats: { views: 65, inquiries: 5 },
    },
    {
      hostId: priyaHost._id,
      title: "King East 1BR",
      address: "560 King St E, Toronto, ON",
      city: "Toronto",
      price: 1200,
      dates: MAY_SEP,
      sqft: 560,
      beds: 1,
      baths: 1,
      type: "Apartment",
      status: "active",
      images: imgs(
        "1522708323590-d24dbb6b0267",
        "1600585154526-990dced4db0d",
        "1600210492493-0b9fc7f5c9d5",
        "1584622650111-993a426fbf0a"
      ),
      description: "Polished one-bedroom on the quieter east end of King Street. Exposed concrete, wide windows, and a thoughtful layout. Distillery District and Corktown both 5-minute walks.",
      amenities: ["High-speed WiFi", "Fully furnished", "In-suite laundry", "Full kitchen", "Central A/C", "Concierge", "Bike storage"],
      rules: ["No smoking", "No pets", "Quiet hours after 11pm"],
      neighborhood: "King East — the calmer, more residential end of King. Still walkable to everything downtown.",
      requirements: { budgetMin: 1050, budgetMax: 1350, lifestyleTags: ["Non-smoker", "Neat freak"], termPreference: "Summer 2025", petPolicy: "no-pets", genderPreference: "no-preference", occupants: 1, referencesRequired: false },
      stats: { views: 53, inquiries: 4 },
    },
    {
      hostId: priyaHost._id,
      title: "Riverside Studio",
      address: "100 Broadview Ave, Toronto, ON",
      city: "Toronto",
      price: 950,
      dates: JUNE_AUG,
      sqft: 400,
      beds: 1,
      baths: 1,
      type: "Studio",
      status: "active",
      images: imgs(
        "1484101403633-562f891dc89a",
        "1554995207-c18c203602cb",
        "1556909114-44e3e9399b79"
      ),
      description: "Compact well-designed studio with great natural light overlooking the Don Valley. Broadview has some of the city's best views and a distinctly local feel.",
      amenities: ["High-speed WiFi", "Fully furnished", "Full kitchen", "Central A/C", "Laundry in building"],
      rules: ["No smoking", "Pets on approval"],
      neighborhood: "Riverside / Broadview — Don Valley greenway at your feet, quick streetcar to downtown.",
      requirements: { budgetMin: 850, budgetMax: 1050, lifestyleTags: ["Non-smoker", "Fitness lover"], termPreference: "Summer 2025", petPolicy: "pets-ok", genderPreference: "no-preference", occupants: 1, referencesRequired: false },
      stats: { views: 38, inquiries: 3 },
    },
    {
      hostId: priyaHost._id,
      title: "West Queen West Loft",
      address: "944 Queen St W, Toronto, ON",
      city: "Toronto",
      price: 1400,
      dates: MAY_AUG,
      sqft: 800,
      beds: 1,
      baths: 1,
      type: "Loft",
      status: "active",
      images: imgs(
        "1560185893-a55a2a1e7432",
        "1493809842364-78817add7ffb",
        "1502005097973-b820ceaf2ab3",
        "1598928506311-c55ded91a20c"
      ),
      description: "Massive loft in the Art + Design District on West Queen West. 800 sq ft with a mezzanine sleeping area, art-quality lighting, and a kitchen designed for someone who actually cooks.",
      amenities: ["High-speed WiFi", "Fully furnished (curated)", "Full kitchen", "In-suite laundry", "Central A/C", "Private courtyard", "Bike storage"],
      rules: ["No smoking", "No parties", "Quiet hours after midnight"],
      neighborhood: "West Queen West — Toronto's art and design district. AGO, MOCA, and some of the city's best restaurants.",
      requirements: { budgetMin: 1250, budgetMax: 1550, lifestyleTags: ["Non-smoker", "Social butterfly"], termPreference: "Summer 2025", petPolicy: "no-pets", genderPreference: "no-preference", occupants: 1, referencesRequired: true },
      stats: { views: 102, inquiries: 9 },
    },
    {
      hostId: priyaHost._id,
      title: "Parkdale Room with Backyard",
      address: "120 Milky Way Dr, Toronto, ON",
      city: "Toronto",
      price: 700,
      dates: MAY_AUG,
      sqft: 200,
      beds: 1,
      baths: 1,
      type: "Room",
      status: "active",
      images: imgs(
        "1560448204-e02f11c3d0e2",
        "1586023492125-27272f1d8b16",
        "1493663284031-b7e3aefcae9e"
      ),
      description: "Lovely private room in a warm Parkdale household of four. Backyard with a fire pit, herb garden, and a hammock. Monthly house dinners are a thing here.",
      amenities: ["WiFi", "Furnished room", "Shared kitchen", "Large backyard + fire pit", "Laundry"],
      rules: ["No smoking inside", "Quiet weeknights after midnight"],
      neighborhood: "Parkdale — multicultural, creative, and genuinely affordable. Queen West streetcar at the door.",
      requirements: { budgetMin: 600, budgetMax: 800, lifestyleTags: ["Social butterfly", "Night owl"], termPreference: "Summer 2025", petPolicy: "no-pets", genderPreference: "no-preference", occupants: 1, referencesRequired: false },
      stats: { views: 31, inquiries: 2 },
    },
    {
      hostId: priyaHost._id,
      title: "Bright 1BR — Leslieville",
      address: "1105 Queen St E, Toronto, ON",
      city: "Toronto",
      price: 1050,
      dates: MAY_SEP,
      sqft: 535,
      beds: 1,
      baths: 1,
      type: "Apartment",
      status: "active",
      images: imgs(
        "1558618666-fcd25c85cd64",
        "1600585154526-990dced4db0d",
        "1555041469-db61528b5b73",
        "1600210492493-0b9fc7f5c9d5"
      ),
      description: "East-facing apartment with gorgeous morning light. Original exposed brick in the bedroom, modern white kitchen, and a deep soaker tub. Leslieville brunch corridor literally at your door.",
      amenities: ["High-speed WiFi", "Fully furnished", "Full kitchen", "In-suite laundry", "Central A/C", "Hardwood floors"],
      rules: ["No smoking", "Pets welcome", "Quiet hours after midnight"],
      neighborhood: "Leslieville — Toronto's brunch capital. Chill weekend vibe, great coffee, and the east beaches nearby.",
      requirements: { budgetMin: 950, budgetMax: 1150, lifestyleTags: ["Non-smoker", "Foodie", "Early bird"], termPreference: "Summer 2025", petPolicy: "pets-ok", genderPreference: "no-preference", occupants: 1, referencesRequired: false },
      stats: { views: 49, inquiries: 4 },
    },
    {
      hostId: priyaHost._id,
      title: "Modern Studio — Regent Park",
      address: "40 Dundas St E, Toronto, ON",
      city: "Toronto",
      price: 875,
      dates: MAY_AUG,
      sqft: 385,
      beds: 1,
      baths: 1,
      type: "Studio",
      status: "active",
      images: imgs(
        "1570129477492-45c003edd2be",
        "1600573472550-8090733a21e0",
        "1600566753190-17f0baa2a6c3"
      ),
      description: "New-build studio in the revitalized Regent Park neighbourhood. The community has been completely transformed — new parks, an aquatics centre, a farmers market, and strong community programming.",
      amenities: ["High-speed WiFi", "Fully furnished", "Full kitchen", "In-suite laundry", "Central A/C", "Concierge", "Bike storage"],
      rules: ["No smoking", "No pets"],
      neighborhood: "Regent Park — newly redeveloped and walking distance to Riverdale, the Distillery, and Cabbagetown.",
      requirements: { budgetMin: 775, budgetMax: 975, lifestyleTags: ["Non-smoker"], termPreference: "Summer 2025", petPolicy: "no-pets", genderPreference: "no-preference", occupants: 1, referencesRequired: false },
      stats: { views: 27, inquiries: 2 },
    },
    {
      hostId: priyaHost._id,
      title: "Cabbagetown 1BR",
      address: "386 Carlton St, Toronto, ON",
      city: "Toronto",
      price: 1100,
      dates: MAY_AUG,
      sqft: 550,
      beds: 1,
      baths: 1,
      type: "Apartment",
      status: "active",
      images: imgs(
        "1598928506311-c55ded91a20c",
        "1554995207-c18c203602cb",
        "1584622650111-993a426fbf0a",
        "1600585154526-990dced4db0d"
      ),
      description: "Victorian one-bedroom in historic Cabbagetown. Tin ceilings, wide plank floors, hardwood throughout. Close to Riverdale Park and the DVP.",
      amenities: ["High-speed WiFi", "Fully furnished", "Full kitchen", "Laundry in building", "Central A/C", "Hardwood floors", "Front porch"],
      rules: ["No smoking", "Small pets welcome", "Quiet hours after 11pm"],
      neighborhood: "Cabbagetown — a Heritage Conservation District. Charming Victorian streets 15 min walk from downtown.",
      requirements: { budgetMin: 1000, budgetMax: 1200, lifestyleTags: ["Non-smoker", "Quiet & studious"], termPreference: "Summer 2025", petPolicy: "pets-ok", genderPreference: "no-preference", occupants: 1, referencesRequired: false },
      stats: { views: 42, inquiries: 3 },
    },
    {
      hostId: priyaHost._id,
      title: "Industrial Loft — Corktown",
      address: "220 King St E, Toronto, ON",
      city: "Toronto",
      price: 1250,
      dates: MAY_AUG,
      sqft: 690,
      beds: 1,
      baths: 1,
      type: "Loft",
      status: "paused",
      images: imgs(
        "1493809842364-78817add7ffb",
        "1560185893-a55a2a1e7432",
        "1502005097973-b820ceaf2ab3",
        "1600573472550-8090733a21e0"
      ),
      description: "Raw and refined Corktown loft with original factory details — steel window frames, polished concrete slab, and exposed sprinkler heads. The kind of space architects put on their Instagram.",
      amenities: ["High-speed WiFi", "Fully furnished", "Full kitchen", "In-suite laundry", "Central A/C", "Bike storage", "Private storage cage"],
      rules: ["No smoking", "No parties", "Quiet hours after midnight"],
      neighborhood: "Corktown — intimate neighbourhood between King East and the Distillery. Great cafés and the Don River trail.",
      requirements: { budgetMin: 1100, budgetMax: 1400, lifestyleTags: ["Non-smoker", "Neat freak"], termPreference: "Summer 2025", petPolicy: "no-pets", genderPreference: "no-preference", occupants: 1, referencesRequired: true },
      stats: { views: 39, inquiries: 3 },
    },
  ]);

  console.log(`Created ${listings.length} listings.`);

  const flagshipListing = listings.find(
    (listing) => listing.title === "Sunlit Studio — Financial District"
  );

  if (!flagshipListing) {
    throw new Error("Flagship demo listing could not be found after seeding");
  }

  const proposedTourSlots = [daysFromNow(2, 10, 0), daysFromNow(2, 14, 30)];
  const confirmedTourSlots = [daysFromNow(3, 11, 0), daysFromNow(3, 16, 0)];

  await Match.insertMany([
    {
      listingId: flagshipListing._id,
      tenantId: aisha._id,
      score: 96,
      sharedTags: ["Non-smoker", "Quiet & studious"],
      status: "pending",
      reasons: [
        {
          label: "Budget fit",
          matched: true,
          detail: "Comfortably within the target range for this listing.",
        },
        {
          label: "Lifestyle match",
          matched: true,
          detail: "Matches the quiet, non-smoking household preference.",
        },
        {
          label: "Transit needs",
          matched: true,
          detail: "Works well for a tenant commuting downtown without a car.",
        },
      ],
    },
    {
      listingId: flagshipListing._id,
      tenantId: chris._id,
      score: 91,
      sharedTags: ["Non-smoker"],
      status: "contacted",
      reasons: [
        {
          label: "Building amenities",
          matched: true,
          detail: "The building gym aligns with Chris's daily routine.",
        },
        {
          label: "Budget fit",
          matched: true,
          detail: "The unit sits at the top of Chris's budget, but still fits.",
        },
      ],
    },
    {
      listingId: flagshipListing._id,
      tenantId: sophia._id,
      score: 88,
      sharedTags: ["Non-smoker"],
      status: "contacted",
      reasons: [
        {
          label: "Neighborhood fit",
          matched: true,
          detail: "Bay Street proximity matches Sophia's internship commute.",
        },
        {
          label: "Lifestyle fit",
          matched: true,
          detail: "Sophia's clean, early-riser routine aligns well with the listing.",
        },
      ],
    },
  ]);

  const [, chrisConversation, sophiaConversation] =
    await Conversation.insertMany([
      {
        listingId: flagshipListing._id,
        hostId: jordan._id,
        tenantId: aisha._id,
        messages: [
          {
            senderId: aisha._id,
            text: "Hi Jordan, this looks like a great fit. Is the studio still available for a summer co-op term?",
            type: "text",
            createdAt: hoursAgo(18),
            updatedAt: hoursAgo(18),
          },
          {
            senderId: jordan._id,
            text: "It is. The unit is fully furnished and ready for May move-in.",
            type: "text",
            createdAt: hoursAgo(16),
            updatedAt: hoursAgo(16),
          },
        ],
        lastMessageAt: hoursAgo(16),
        unreadByHost: 1,
        unreadByTenant: 0,
      },
      {
        listingId: flagshipListing._id,
        hostId: jordan._id,
        tenantId: chris._id,
        messages: [
          {
            senderId: chris._id,
            text: "The building gym is a big plus for me. Could we set up a tour?",
            type: "text",
            createdAt: hoursAgo(12),
            updatedAt: hoursAgo(12),
          },
          {
            senderId: jordan._id,
            text: "Absolutely. I have a couple of times open this week.",
            type: "text",
            createdAt: hoursAgo(11),
            updatedAt: hoursAgo(11),
          },
          {
            senderId: jordan._id,
            text: "I am available at these times. Pick the one that works best for you.",
            type: "tour-proposal",
            tourSlots: proposedTourSlots,
            createdAt: hoursAgo(10),
            updatedAt: hoursAgo(10),
          },
        ],
        lastMessageAt: hoursAgo(10),
        unreadByHost: 0,
        unreadByTenant: 1,
      },
      {
        listingId: flagshipListing._id,
        hostId: jordan._id,
        tenantId: sophia._id,
        messages: [
          {
            senderId: sophia._id,
            text: "The location is perfect for Bay Street. Are you free for a quick virtual walkthrough?",
            type: "text",
            createdAt: hoursAgo(8),
            updatedAt: hoursAgo(8),
          },
          {
            senderId: jordan._id,
            text: "Yes. I am available at these times. Pick the one that works best for you.",
            type: "tour-proposal",
            tourSlots: confirmedTourSlots,
            createdAt: hoursAgo(7),
            updatedAt: hoursAgo(7),
          },
          {
            senderId: jordan._id,
            text: "Tour confirmed. I just shared the meeting link.",
            type: "tour-confirmed",
            selectedSlot: confirmedTourSlots[1],
            meetLink: "https://meet.google.com/sub-let-me-demo",
            createdAt: hoursAgo(6),
            updatedAt: hoursAgo(6),
          },
        ],
        lastMessageAt: hoursAgo(6),
        unreadByHost: 0,
        unreadByTenant: 0,
      },
    ]);

  await Tour.insertMany([
    {
      conversationId: chrisConversation._id,
      listingId: flagshipListing._id,
      hostId: jordan._id,
      tenantId: chris._id,
      proposedSlots: proposedTourSlots,
      status: "proposed",
    },
    {
      conversationId: sophiaConversation._id,
      listingId: flagshipListing._id,
      hostId: jordan._id,
      tenantId: sophia._id,
      proposedSlots: confirmedTourSlots,
      selectedSlot: confirmedTourSlots[1],
      meetLink: "https://meet.google.com/sub-let-me-demo",
      status: "confirmed",
    },
  ]);

  console.log("Created seeded matches, conversations, and tours.");
  console.log("\n✅ Seed complete!");
  console.log("   • 5 hosts");
  console.log("   • 7 tenants");
  console.log(`   • ${listings.length} listings across 20 Toronto neighbourhoods`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
