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
  senderId: "landlord" | number;
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
