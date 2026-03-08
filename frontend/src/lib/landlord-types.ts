export type LandlordListingStatus = "active" | "paused" | "filled";
export type LandlordPetPolicy = "no-pets" | "pets-ok";
export type LandlordGenderPreference =
  | "no-preference"
  | "male"
  | "female"
  | "non-binary";
export type LandlordMatchStatus = "pending" | "contacted" | "declined";
export type LandlordTourStatus =
  | "proposed"
  | "confirmed"
  | "completed"
  | "cancelled";
export type LandlordMessageType = "text" | "tour-proposal" | "tour-confirmed";

export type LandlordRequirements = {
  budgetMin: number;
  budgetMax: number;
  lifestyleTags: string[];
  termPreference: string;
  petPolicy: LandlordPetPolicy;
  genderPreference: LandlordGenderPreference;
  occupants: number;
  referencesRequired: boolean;
};

export type LandlordListingSummary = {
  id: string;
  title: string;
  address: string;
  price: number;
  dates: string;
  image: string | null;
  status: LandlordListingStatus;
  matches: number;
  views: number;
  inquiries: number;
  videoProcessing: boolean;
  highlightUrl: string;
};

export type LandlordDashboardTotals = {
  activeListings: number;
  totalMatches: number;
  unreadMessages: number;
  upcomingTours: number;
};

export type LandlordListingsResponse = {
  listings: LandlordListingSummary[];
  totals: LandlordDashboardTotals;
};

export type LandlordListingDetail = LandlordListingSummary & {
  requirements: LandlordRequirements;
  galleryImages: string[];
  enrichmentStatus: string;
};

export type LandlordConversationMessage = {
  id: string;
  sender: "host" | "tenant";
  senderName: string;
  text: string;
  timestamp: string;
  type: LandlordMessageType;
  tourSlots?: string[];
  selectedSlot?: string;
  meetLink?: string;
};

export type LandlordTour = {
  id: string;
  status: LandlordTourStatus;
  proposedSlots: string[];
  selectedSlot?: string;
  meetLink?: string;
};

export type LandlordMatchReason = {
  label: string;
  matched: boolean;
  detail: string;
};

export type LandlordMatch = {
  id: string;
  name: string;
  university: string;
  term: string;
  avatar: string;
  match: number;
  lifestyleTags: string[];
  bio: string;
  sharedTags: string[];
  reasons: LandlordMatchReason[];
  status: LandlordMatchStatus;
  conversationId: string | null;
  unreadCount: number;
  messages: LandlordConversationMessage[];
  tour: LandlordTour | null;
};

export type LandlordListingDetailResponse = {
  listing: LandlordListingDetail;
};

export type LandlordMatchesResponse = {
  matches: LandlordMatch[];
};

export type LandlordNotificationType = "match" | "message" | "tour" | "system";

export type LandlordNotification = {
  id: string;
  type: LandlordNotificationType;
  title: string;
  description: string;
  timestamp: string;
  unread: boolean;
  listingId?: string;
  studentId?: string;
  conversationId?: string;
};
