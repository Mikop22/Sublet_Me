import test from "node:test";
import assert from "node:assert/strict";

type SmokeResult = { ok: boolean; errors: string[] };

function validateLandlordListingsPayload(data: unknown): SmokeResult {
  const errors: string[] = [];
  const record = data as Record<string, unknown> | null;
  if (!record || typeof record !== "object") return { ok: false, errors: ["Response is not an object"] };
  if (!Array.isArray(record.listings)) errors.push("Missing listings array");
  if (!record.totals || typeof record.totals !== "object") errors.push("Missing totals object");
  return { ok: errors.length === 0, errors };
}

function validateAssistantTurnPayload(data: unknown): SmokeResult {
  const errors: string[] = [];
  const record = data as Record<string, unknown> | null;
  if (!record || typeof record !== "object") return { ok: false, errors: ["Response is not an object"] };
  if (typeof record.session_id !== "string" || !record.session_id) errors.push("Missing or empty session_id");
  if (typeof record.assistant_message !== "string") errors.push("Missing assistant_message");
  if (!Array.isArray(record.listings)) errors.push("Missing listings array");
  return { ok: errors.length === 0, errors };
}

test("validateLandlordListingsPayload passes with valid data", () => {
  const result = validateLandlordListingsPayload({ listings: [], totals: { activeListings: 0 } });
  assert.equal(result.ok, true);
});

test("validateLandlordListingsPayload fails with missing totals", () => {
  const result = validateLandlordListingsPayload({ listings: [] });
  assert.equal(result.ok, false);
  assert.equal(result.errors.some((e) => e.includes("totals")), true);
});

test("validateLandlordListingsPayload fails with null data", () => {
  const result = validateLandlordListingsPayload(null);
  assert.equal(result.ok, false);
});

test("validateAssistantTurnPayload passes with valid data", () => {
  const result = validateAssistantTurnPayload({
    session_id: "s1",
    assistant_message: "Hello",
    listings: [],
  });
  assert.equal(result.ok, true);
});

test("validateAssistantTurnPayload fails with empty session_id", () => {
  const result = validateAssistantTurnPayload({
    session_id: "",
    assistant_message: "Hello",
    listings: [],
  });
  assert.equal(result.ok, false);
});

test("validateAssistantTurnPayload fails with missing listings", () => {
  const result = validateAssistantTurnPayload({
    session_id: "s1",
    assistant_message: "Hello",
  });
  assert.equal(result.ok, false);
});
