export type SmokeResult = {
  ok: boolean;
  errors: string[];
};

export function validateLandlordListingsPayload(data: unknown): SmokeResult {
  const errors: string[] = [];
  const record = data as Record<string, unknown> | null;

  if (!record || typeof record !== "object") {
    return { ok: false, errors: ["Response is not an object"] };
  }

  if (!Array.isArray(record.listings)) {
    errors.push("Missing listings array");
  }

  if (!record.totals || typeof record.totals !== "object") {
    errors.push("Missing totals object");
  }

  return { ok: errors.length === 0, errors };
}

export function validateAssistantTurnPayload(data: unknown): SmokeResult {
  const errors: string[] = [];
  const record = data as Record<string, unknown> | null;

  if (!record || typeof record !== "object") {
    return { ok: false, errors: ["Response is not an object"] };
  }

  if (typeof record.session_id !== "string" || !record.session_id) {
    errors.push("Missing or empty session_id");
  }

  if (typeof record.assistant_message !== "string") {
    errors.push("Missing assistant_message");
  }

  if (!Array.isArray(record.listings)) {
    errors.push("Missing listings array");
  }

  return { ok: errors.length === 0, errors };
}

export function validateLandlordDetailPayload(data: unknown): SmokeResult {
  const errors: string[] = [];
  const record = data as Record<string, unknown> | null;

  if (!record || typeof record !== "object") {
    return { ok: false, errors: ["Response is not an object"] };
  }

  if (!record.listing || typeof record.listing !== "object") {
    errors.push("Missing listing object");
  }

  return { ok: errors.length === 0, errors };
}

export function validateMatchesPayload(data: unknown): SmokeResult {
  const errors: string[] = [];
  const record = data as Record<string, unknown> | null;

  if (!record || typeof record !== "object") {
    return { ok: false, errors: ["Response is not an object"] };
  }

  if (!Array.isArray(record.matches)) {
    errors.push("Missing matches array");
  }

  return { ok: errors.length === 0, errors };
}
