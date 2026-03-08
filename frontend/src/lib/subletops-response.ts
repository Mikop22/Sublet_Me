export type TurnResponse = {
  session_id: string;
  assistant_message: string;
  next_action: string;
  confidence: number;
  listings: ListingResult[];
};

export type ListingResult = {
  id: string;
  title: string;
  city: string;
  price: number;
  score: number;
  reasons: string[];
  image_url: string;
};

export type HistoryResponse = {
  session_id: string | null;
  turns: {
    role: string;
    message: string;
    timestamp: string;
    metadata: Record<string, unknown>;
  }[];
};

function coerceListings(arr: unknown[]): ListingResult[] {
  return arr
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null
    )
    .map((item) => ({
      id: typeof item.id === "string" ? item.id : "",
      title: typeof item.title === "string" ? item.title : "Untitled",
      city: typeof item.city === "string" ? item.city : "",
      price: typeof item.price === "number" ? item.price : 0,
      score: typeof item.score === "number" ? item.score : 0,
      reasons: Array.isArray(item.reasons)
        ? item.reasons.filter((r): r is string => typeof r === "string")
        : [],
      image_url: typeof item.image_url === "string" ? item.image_url : "",
    }));
}

export function normalizeTurnResponse(payload: unknown): TurnResponse {
  const record = (
    typeof payload === "object" && payload !== null ? payload : {}
  ) as Record<string, unknown>;
  return {
    session_id:
      typeof record.session_id === "string" ? record.session_id : "",
    assistant_message:
      typeof record.assistant_message === "string"
        ? record.assistant_message
        : "",
    next_action:
      typeof record.next_action === "string" ? record.next_action : "",
    confidence:
      typeof record.confidence === "number" ? record.confidence : 0,
    listings: Array.isArray(record.listings)
      ? coerceListings(record.listings)
      : [],
  };
}

export function normalizeHistoryResponse(payload: unknown): HistoryResponse {
  const record = (
    typeof payload === "object" && payload !== null ? payload : {}
  ) as Record<string, unknown>;
  return {
    session_id:
      typeof record.session_id === "string" ? record.session_id : null,
    turns: Array.isArray(record.turns)
      ? record.turns
          .filter(
            (t): t is Record<string, unknown> =>
              typeof t === "object" && t !== null
          )
          .map((t) => ({
            role: typeof t.role === "string" ? t.role : "unknown",
            message: typeof t.message === "string" ? t.message : "",
            timestamp: typeof t.timestamp === "string" ? t.timestamp : "",
            metadata:
              typeof t.metadata === "object" && t.metadata !== null
                ? (t.metadata as Record<string, unknown>)
                : {},
          }))
      : [],
  };
}
