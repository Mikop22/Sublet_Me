import test from "node:test";
import assert from "node:assert/strict";

function coerceListings(arr: unknown[]) {
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
        ? item.reasons.filter((r: unknown): r is string => typeof r === "string")
        : [],
      image_url: typeof item.image_url === "string" ? item.image_url : "",
    }));
}

function normalizeTurnResponse(payload: unknown) {
  const record = (
    typeof payload === "object" && payload !== null ? payload : {}
  ) as Record<string, unknown>;
  return {
    session_id: typeof record.session_id === "string" ? record.session_id : "",
    assistant_message:
      typeof record.assistant_message === "string"
        ? record.assistant_message
        : "",
    next_action:
      typeof record.next_action === "string" ? record.next_action : "",
    confidence: typeof record.confidence === "number" ? record.confidence : 0,
    listings: Array.isArray(record.listings)
      ? coerceListings(record.listings)
      : [],
  };
}

function normalizeHistoryResponse(payload: unknown) {
  const record = (
    typeof payload === "object" && payload !== null ? payload : {}
  ) as Record<string, unknown>;
  return {
    session_id:
      typeof record.session_id === "string" ? record.session_id : null,
    turns: Array.isArray(record.turns)
      ? record.turns
          .filter(
            (t: unknown): t is Record<string, unknown> =>
              typeof t === "object" && t !== null
          )
          .map((t: Record<string, unknown>) => ({
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

test("normalizeTurnResponse handles a valid payload", () => {
  const result = normalizeTurnResponse({
    session_id: "s1",
    assistant_message: "Hello!",
    next_action: "recommend",
    confidence: 0.88,
    listings: [
      {
        id: "abc",
        title: "Nice place",
        city: "Boston",
        price: 1500,
        score: 92,
        reasons: ["budget match"],
        image_url: "https://example.com/img.jpg",
      },
    ],
  });
  assert.equal(result.session_id, "s1");
  assert.equal(result.assistant_message, "Hello!");
  assert.equal(result.listings.length, 1);
  assert.equal(result.listings[0].title, "Nice place");
});

test("normalizeTurnResponse handles null payload", () => {
  const result = normalizeTurnResponse(null);
  assert.equal(result.session_id, "");
  assert.equal(result.listings.length, 0);
});

test("normalizeTurnResponse handles missing fields", () => {
  const result = normalizeTurnResponse({ session_id: "s1" });
  assert.equal(result.assistant_message, "");
  assert.equal(result.confidence, 0);
  assert.equal(result.listings.length, 0);
});

test("normalizeHistoryResponse handles valid history", () => {
  const result = normalizeHistoryResponse({
    session_id: "s1",
    turns: [
      {
        role: "user",
        message: "Hello",
        timestamp: "2026-01-01T00:00:00Z",
        metadata: {},
      },
      {
        role: "assistant",
        message: "Hi!",
        timestamp: "2026-01-01T00:00:01Z",
        metadata: {},
      },
    ],
  });
  assert.equal(result.session_id, "s1");
  assert.equal(result.turns.length, 2);
  assert.equal(result.turns[0].role, "user");
});

test("normalizeHistoryResponse handles null payload", () => {
  const result = normalizeHistoryResponse(null);
  assert.equal(result.session_id, null);
  assert.equal(result.turns.length, 0);
});

test("coerceListings filters out non-objects", () => {
  const result = coerceListings([null, "string", 42, { id: "a", title: "Good" }]);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "a");
});
