# Hackathon Demo P1/P2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Finish the post-P0 demo work so the tenant assistant, landlord notifications, AI Studio, and demo hardening paths are credible, connected, and safe to present live.

**Architecture:** Keep the landlord-first P0 flow intact and treat P1 as productization of adjacent demo surfaces rather than a new platform build. Use the existing Next.js app as the product/BFF layer, keep Mongo-backed landlord data in the frontend app routes, and extend the FastAPI SubletOps backend only where the assistant contract is currently broken or too weak for the demo.

**Tech Stack:** Next.js 16 App Router, TypeScript, React 19, Mongoose/MongoDB, Auth0, Cloudinary, FastAPI, Pydantic, existing in-memory SubletOps store

---

## Scope Guardrails

- Do not expand into a full two-sided production marketplace. Ship only the missing demo-visible surfaces.
- Do not introduce a general notification system or event bus for hackathon scope; derive notifications from existing Mongo data.
- Do not build a persistent Mongo-backed orchestrator store unless P1 is fully complete and rehearsal time remains.
- Keep the demo-login path dev-only and out of the production story.
- Prefer stable, deterministic data and graceful degradation over ambitious live integrations that can fail during the demo.

## P1 Outcome

P1 is complete when:

1. `/assistant` hydrates history correctly and returns a coherent assistant response every time.
2. Assistant turns can surface listing recommendations in the UI using a response contract that is actually implemented end-to-end.
3. Landlord dashboard notifications and `/landlord/notifications` load derived real data instead of hardcoded mocks.
4. The demo surfaces communicate degraded states clearly when Backboard or the video pipeline is unavailable.
5. The seeded and live flows can both be rehearsed without product dead ends.

## P2 Outcome

P2 is complete when:

1. `AI Studio` is connected to real landlord listing media instead of sample images.
2. There is a lightweight automated smoke pass for the demo-critical flows.
3. Assistant, notifications, AI Studio, and listing creation have polished loading/error/empty states.
4. Demo operators have a clear recovery checklist for rehearsals.

---

## P1 Tasks

### Task 1: Repair the SubletOps Assistant Contract and History Flow

**Files:**
- Modify: `backend/app/models/orchestrator.py`
- Modify: `backend/app/services/memory_store.py`
- Modify: `backend/app/services/orchestrator_service.py`
- Modify: `backend/app/api/orchestrator.py`
- Modify: `backend/requirements.txt`
- Modify: `backend/pyproject.toml`
- Create: `backend/tests/test_orchestrator_service.py`
- Create: `backend/tests/test_orchestrator_api.py`
- Create: `frontend/src/lib/subletops-response.ts`
- Create: `frontend/src/lib/subletops-response.test.ts`
- Modify: `frontend/src/app/api/subletops/turn/route.ts`
- Modify: `frontend/src/app/assistant/page.tsx`

**Step 1: Add backend test support and write the failing history/turn tests**

Add `pytest` to `backend/requirements.txt` and `backend/pyproject.toml`, then create backend tests that lock the missing contract:

```python
# backend/tests/test_orchestrator_service.py

def test_process_turn_returns_listings_and_persists_history(service):
    response = service.process_turn(payload)
    assert response.session_id
    assert len(response.listings) > 0
    history = service.get_history(user_sub=payload.user.sub, session_id=response.session_id)
    assert [turn.role for turn in history.turns] == ["user", "assistant"]
```

```python
# backend/tests/test_orchestrator_api.py

def test_history_endpoint_returns_latest_session(client):
    turn = client.post("/v1/orchestrator/turn", json=payload).json()
    history = client.get(f"/v1/orchestrator/history?user_sub=test-user").json()
    assert history["session_id"] == turn["session_id"]
    assert len(history["turns"]) == 2
```

**Step 2: Extend the backend response models to match the assistant UI**

In `backend/app/models/orchestrator.py`, add explicit models for chat history and assistant listings:

```python
class ChatTurn(BaseModel):
    role: str
    message: str
    timestamp: datetime
    metadata: dict[str, Any] = Field(default_factory=dict)

class OrchestratorHistoryResponse(BaseModel):
    session_id: str | None = None
    turns: list[ChatTurn] = Field(default_factory=list)

class OrchestratorTurnResponse(BaseModel):
    session_id: str
    assistant_message: str
    next_action: str
    confidence: float
    reasons: list[str] = Field(default_factory=list)
    listings: list[ListingRecommendation] = Field(default_factory=list)
    updated_at: datetime = Field(default_factory=utc_now)
```

**Step 3: Add the missing store/service methods for history lookup**

In `backend/app/services/memory_store.py`, add the minimal methods needed for the current BFF:

```python
@abstractmethod
def get_latest_session_id(self, user_sub: str) -> str | None:
    raise NotImplementedError
```

Implement it in `InMemoryStore`, then add `OrchestratorService.get_history(...)` that:

- uses `session_id` if provided
- otherwise resolves the latest session for the user
- returns `OrchestratorHistoryResponse`
- returns an empty history instead of throwing when the user has no sessions yet

**Step 4: Fix `process_turn()` so it returns usable recommendations**

Update `backend/app/services/orchestrator_service.py` so `process_turn()` includes a small set of `ListingRecommendation` rows in the response:

```python
listings = self._build_listing_recommendations(profile, limit=5)
...
return OrchestratorTurnResponse(
    session_id=session_id,
    assistant_message=assistant_message,
    next_action=next_action,
    confidence=confidence,
    reasons=reasons,
    listings=listings,
    updated_at=utc_now(),
)
```

Also add an explicit `get_history(...)` service method and keep Backboard failure handling deterministic.

**Step 5: Expose the backend history route**

In `backend/app/api/orchestrator.py`, add:

```python
@router.get("/orchestrator/history", response_model=OrchestratorHistoryResponse)
def orchestrator_history(
    user_sub: str,
    session_id: str | None = None,
    service: OrchestratorService = Depends(get_orchestrator_service),
) -> OrchestratorHistoryResponse:
    return service.get_history(user_sub=user_sub, session_id=session_id)
```

**Step 6: Normalize the frontend BFF payloads before they reach React**

Create `frontend/src/lib/subletops-response.ts` with small parsing helpers that guard against backend drift:

```ts
export function normalizeTurnResponse(payload: unknown): TurnResponse {
  const record = payload as Record<string, unknown>;
  return {
    session_id: typeof record.session_id === "string" ? record.session_id : "",
    assistant_message:
      typeof record.assistant_message === "string"
        ? record.assistant_message
        : "",
    next_action: typeof record.next_action === "string" ? record.next_action : "",
    confidence: typeof record.confidence === "number" ? record.confidence : 0,
    listings: Array.isArray(record.listings) ? coerceListings(record.listings) : [],
  };
}
```

Use the helper in `frontend/src/app/api/subletops/turn/route.ts` and add unit tests in `frontend/src/lib/subletops-response.test.ts`.

**Step 7: Make the assistant page use the repaired contract**

Update `frontend/src/app/assistant/page.tsx` to:

- hydrate history from the now-real GET endpoint
- render response listings with stable empty/error states
- link listing cards to `/listings/[id]` only if the returned `id` looks like a real Mongo ID
- show a non-blocking degraded-mode note when the response metadata says the fallback assistant was used

**Step 8: Verify the assistant flow**

Run:

```bash
cd /Users/user/Desktop/Frontend/backend && python -m pytest tests/test_orchestrator_service.py tests/test_orchestrator_api.py -q
cd /Users/user/Desktop/Frontend/frontend && node --test --experimental-strip-types src/lib/subletops-response.test.ts
cd /Users/user/Desktop/Frontend/frontend && npx tsc --noEmit
```

Manual check:

1. Open `/assistant`
2. Confirm the initial GET no longer 404s or silently fails
3. Send a message
4. Refresh the page
5. Confirm the conversation history rehydrates and at least one recommendation card renders

**Step 9: Commit**

```bash
git add backend/app/models/orchestrator.py backend/app/services/memory_store.py backend/app/services/orchestrator_service.py backend/app/api/orchestrator.py backend/requirements.txt backend/pyproject.toml backend/tests/test_orchestrator_service.py backend/tests/test_orchestrator_api.py frontend/src/lib/subletops-response.ts frontend/src/lib/subletops-response.test.ts frontend/src/app/api/subletops/turn/route.ts frontend/src/app/assistant/page.tsx
git commit -m "feat: repair assistant history and turn contracts"
```

---

### Task 2: Replace Landlord Notification Mocks with Derived Data

**Files:**
- Create: `frontend/src/lib/landlord-notifications.ts`
- Create: `frontend/src/lib/landlord-notifications.test.ts`
- Create: `frontend/src/app/api/landlord/notifications/route.ts`
- Modify: `frontend/src/lib/landlord-types.ts`
- Modify: `frontend/src/app/landlord/dashboard/page.tsx`
- Modify: `frontend/src/app/landlord/notifications/page.tsx`

**Step 1: Write failing tests for derived notification rows**

Create `frontend/src/lib/landlord-notifications.test.ts` to lock the expected activity feed shape:

```ts
import test from "node:test";
import assert from "node:assert/strict";

import { buildLandlordNotifications } from "@/lib/landlord-notifications";

test("buildLandlordNotifications creates match message and tour events", () => {
  const notifications = buildLandlordNotifications({
    listings: [listing],
    matches: [match],
    conversations: [conversation],
    tours: [tour],
  });

  assert.equal(notifications[0].type, "message");
  assert.equal(notifications.some((item) => item.type === "tour"), true);
});
```

**Step 2: Add shared notification types**

In `frontend/src/lib/landlord-types.ts`, add:

```ts
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
```

**Step 3: Build a derived notification helper over existing Mongo collections**

Implement `frontend/src/lib/landlord-notifications.ts` so it derives a flat feed from:

- `Match` documents for new AI matches
- `Conversation` unread counts and last inbound tenant messages
- `Tour` state changes for proposed/confirmed tours
- `Listing` titles for readable copy

Keep the hackathon rule simple:

- derive `unread` from `Conversation.unreadByHost > 0`
- treat recent `Match` and `Tour` items as informational rows
- do not create a new persistence model for notification read state

**Step 4: Add a landlord notifications API route**

Create `frontend/src/app/api/landlord/notifications/route.ts` that:

- resolves the current host with `requireCurrentHost()`
- loads the host's `Listing`, `Match`, `Conversation`, and `Tour` records
- returns the derived `LandlordNotification[]`
- also returns `unreadCount` for the dashboard bell

**Step 5: Replace dashboard popover mocks**

Update `frontend/src/app/landlord/dashboard/page.tsx` to fetch `/api/landlord/notifications` and:

- replace the hardcoded popover rows
- show the real `unreadCount` badge instead of a permanent red dot
- deep-link message/tour notifications into the relevant landlord listing detail page

**Step 6: Replace the full notifications page mocks**

Update `frontend/src/app/landlord/notifications/page.tsx` to:

- remove `MOCK_NOTIFICATIONS`
- fetch the API with `cache: "no-store"`
- show loading, empty, and error states
- remove fake local read bookkeeping that is no longer grounded in data

**Step 7: Verify the notification flow**

Run:

```bash
cd /Users/user/Desktop/Frontend/frontend && node --test --experimental-strip-types src/lib/landlord-notifications.test.ts
cd /Users/user/Desktop/Frontend/frontend && npx tsc --noEmit
```

Manual check:

1. Open `/landlord/dashboard`
2. Open the notification bell
3. Confirm rows reflect seeded matches/messages/tours instead of sample copy
4. Open `/landlord/notifications`
5. Confirm it shows the same derived feed and routes into landlord listing detail pages

**Step 8: Commit**

```bash
git add frontend/src/lib/landlord-notifications.ts frontend/src/lib/landlord-notifications.test.ts frontend/src/app/api/landlord/notifications/route.ts frontend/src/lib/landlord-types.ts frontend/src/app/landlord/dashboard/page.tsx frontend/src/app/landlord/notifications/page.tsx
git commit -m "feat: derive landlord notifications from live data"
```

---

### Task 3: Add Demo-Safe Failure States and Fallback Handling

**Files:**
- Modify: `backend/app/models/orchestrator.py`
- Modify: `backend/app/services/orchestrator_service.py`
- Create: `backend/tests/test_orchestrator_fallbacks.py`
- Create: `frontend/src/lib/listing-processing.ts`
- Create: `frontend/src/lib/listing-processing.test.ts`
- Modify: `frontend/src/models/Listing.ts`
- Modify: `frontend/src/lib/pipeline.ts`
- Modify: `frontend/src/app/api/listings/[id]/route.ts`
- Modify: `frontend/src/app/api/landlord/listings/[listingId]/route.ts`
- Modify: `frontend/src/app/assistant/page.tsx`
- Modify: `frontend/src/app/landlord/dashboard/new/page.tsx`
- Modify: `frontend/src/app/landlord/dashboard/[listingId]/page.tsx`
- Modify: `frontend/src/app/listings/[id]/page.tsx`

**Step 1: Write the failing tests for assistant fallback metadata and listing processing state**

Backend test:

```python
def test_process_turn_marks_fallback_source_when_backboard_unavailable(service):
    response = service.process_turn(payload)
    assert response.reasons
    assert response.metadata["source"] in {"backboard", "deterministic_fallback"}
```

Frontend helper test:

```ts
test("deriveListingProcessingState returns failed when processing is false and no media exists", () => {
  assert.equal(
    deriveListingProcessingState({ videoProcessing: false, highlightUrl: "", galleryImages: [] }),
    "failed"
  );
});
```

**Step 2: Extend the assistant response metadata for degraded mode**

In `backend/app/models/orchestrator.py`, add an explicit metadata envelope to `OrchestratorTurnResponse`:

```python
class AssistantRuntimeMetadata(BaseModel):
    source: str
    degraded: bool = False
```

Then set it in `process_turn()` so the frontend can render copy like "Demo fallback recommendations shown" without guessing.

**Step 3: Promote listing processing to a first-class UI state**

Create `frontend/src/lib/listing-processing.ts` with a small helper:

```ts
export type ListingProcessingState = "processing" | "ready" | "failed";

export function deriveListingProcessingState(input: {
  videoProcessing: boolean;
  highlightUrl: string;
  galleryImages: string[];
}): ListingProcessingState {
  if (input.videoProcessing) return "processing";
  if (input.highlightUrl || input.galleryImages.length > 0) return "ready";
  return "failed";
}
```

**Step 4: Persist a failure status for pipeline runs that end without media**

Use the existing `Listing.enrichment.status` field in `frontend/src/models/Listing.ts` and `frontend/src/lib/pipeline.ts`:

- set `enrichment.status = "processing"` when the listing is created
- set `enrichment.status = "complete"` on successful media patch
- set `enrichment.status = "failed"` in the error path

Expose this field through landlord/public listing API routes.

**Step 5: Update the assistant and listing UIs to explain degraded states**

Update:

- `frontend/src/app/assistant/page.tsx`
- `frontend/src/app/landlord/dashboard/new/page.tsx`
- `frontend/src/app/landlord/dashboard/[listingId]/page.tsx`
- `frontend/src/app/listings/[id]/page.tsx`

to show explicit copy for:

- assistant fallback mode
- video still processing
- video processing failed but the listing still exists
- generated media ready

Do not leave users in a silent empty state.

**Step 6: Verify fallback behavior**

Run:

```bash
cd /Users/user/Desktop/Frontend/backend && python -m pytest tests/test_orchestrator_fallbacks.py -q
cd /Users/user/Desktop/Frontend/frontend && node --test --experimental-strip-types src/lib/listing-processing.test.ts
cd /Users/user/Desktop/Frontend/frontend && npx tsc --noEmit
```

Manual check:

1. Load `/assistant` with the backend reachable but Backboard unavailable
2. Confirm the page stays usable and calls out fallback mode
3. Create a listing with pipeline credentials intentionally absent
4. Confirm landlord/public listing pages show a clear failed-processing state instead of a blank media area

**Step 7: Commit**

```bash
git add backend/app/models/orchestrator.py backend/app/services/orchestrator_service.py backend/tests/test_orchestrator_fallbacks.py frontend/src/lib/listing-processing.ts frontend/src/lib/listing-processing.test.ts frontend/src/models/Listing.ts frontend/src/lib/pipeline.ts frontend/src/app/api/listings/[id]/route.ts frontend/src/app/api/landlord/listings/[listingId]/route.ts frontend/src/app/assistant/page.tsx frontend/src/app/landlord/dashboard/new/page.tsx frontend/src/app/landlord/dashboard/[listingId]/page.tsx frontend/src/app/listings/[id]/page.tsx
git commit -m "feat: add explicit fallback and processing states"
```

---

## P2 Tasks

### Task 4: Connect AI Studio to Real Listing Media

**Files:**
- Create: `frontend/src/lib/ai-studio.ts`
- Create: `frontend/src/lib/ai-studio.test.ts`
- Create: `frontend/src/app/api/landlord/ai-studio/route.ts`
- Modify: `frontend/src/app/landlord/ai-studio/page.tsx`
- Modify: `frontend/src/app/landlord/dashboard/[listingId]/page.tsx`
- Modify: `frontend/src/lib/cloudinary.ts`

**Step 1: Write failing tests for listing-backed AI Studio transforms**

Create `frontend/src/lib/ai-studio.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";

import { buildStudioAssetOptions } from "@/lib/ai-studio";

test("buildStudioAssetOptions returns transforms for listing images and highlight poster", () => {
  const assets = buildStudioAssetOptions(listing);
  assert.equal(assets.length > 0, true);
  assert.equal(assets[0].transforms.some((item) => item.id === "enhance"), true);
});
```

**Step 2: Create a listing-backed AI Studio data helper**

Implement `frontend/src/lib/ai-studio.ts` so it maps a landlord-owned listing into:

- source assets from `images[]`
- optional poster/thumbnail assets from `highlightUrl` or `videoPublicId`
- Cloudinary transform presets already used by the current demo page

Keep it pure so it remains unit-testable.

**Step 3: Add an AI Studio API route for the current host**

Create `frontend/src/app/api/landlord/ai-studio/route.ts` that:

- resolves the current host
- lists landlord-owned listings that have at least one image or a `videoPublicId`
- returns the normalized AI Studio asset payload

**Step 4: Replace sample data in the AI Studio page**

Update `frontend/src/app/landlord/ai-studio/page.tsx` to:

- fetch the API instead of using `SAMPLE_IMAGES`
- let the host switch between their own listings/assets
- preserve the before/after compare interaction and current transform palette
- show an empty state if no completed media exists yet

**Step 5: Link the listing detail page into AI Studio**

In `frontend/src/app/landlord/dashboard/[listingId]/page.tsx`, add a CTA to open AI Studio pre-filtered to the current listing once media is available.

**Step 6: Verify the AI Studio integration**

Run:

```bash
cd /Users/user/Desktop/Frontend/frontend && node --test --experimental-strip-types src/lib/ai-studio.test.ts
cd /Users/user/Desktop/Frontend/frontend && npx tsc --noEmit
```

Manual check:

1. Open `/landlord/ai-studio`
2. Confirm the asset picker shows real landlord listing media
3. Switch between at least two transforms
4. Open AI Studio from a landlord listing detail page and confirm it focuses that listing

**Step 7: Commit**

```bash
git add frontend/src/lib/ai-studio.ts frontend/src/lib/ai-studio.test.ts frontend/src/app/api/landlord/ai-studio/route.ts frontend/src/app/landlord/ai-studio/page.tsx frontend/src/app/landlord/dashboard/[listingId]/page.tsx frontend/src/lib/cloudinary.ts
git commit -m "feat: connect ai studio to landlord listing media"
```

---

### Task 5: Add a Lightweight Demo Smoke Pass

**Files:**
- Create: `backend/tests/test_demo_contracts.py`
- Create: `frontend/src/lib/demo-smoke.ts`
- Create: `frontend/src/lib/demo-smoke.test.ts`
- Create: `frontend/scripts/demo-smoke.ts`
- Modify: `frontend/package.json`
- Create: `docs/demo-rehearsal-checklist.md`

**Step 1: Write the failing smoke tests and checks**

Backend contract test:

```python
def test_turn_history_and_match_routes_share_required_fields(client):
    turn = client.post("/v1/orchestrator/turn", json=payload).json()
    assert "session_id" in turn
    history = client.get("/v1/orchestrator/history?user_sub=test-user").json()
    assert history["turns"]
```

Frontend smoke helper test:

```ts
test("validateDemoSmokePayload returns errors for missing landlord stats", () => {
  const result = validateDemoSmokePayload({ listings: [], totals: null });
  assert.equal(result.ok, false);
});
```

**Step 2: Create a small cross-surface smoke helper**

Implement `frontend/src/lib/demo-smoke.ts` to validate:

- landlord listings response shape
- landlord detail response shape
- matches response shape
- assistant turn response shape

**Step 3: Add a scriptable smoke runner**

Create `frontend/scripts/demo-smoke.ts` that:

- hits the local app routes in sequence
- checks for required fields only, not pixel-perfect UI
- exits non-zero if any core payload is missing

Add a script to `frontend/package.json`:

```json
{
  "scripts": {
    "demo:smoke": "tsx scripts/demo-smoke.ts"
  }
}
```

**Step 4: Add a short operator checklist**

Create `docs/demo-rehearsal-checklist.md` with:

- seed/reset commands
- demo-login shortcut
- smoke command
- what to do if assistant history fails
- what to do if pipeline media is still processing

**Step 5: Verify the smoke pass**

Run:

```bash
cd /Users/user/Desktop/Frontend/backend && python -m pytest tests/test_demo_contracts.py -q
cd /Users/user/Desktop/Frontend/frontend && node --test --experimental-strip-types src/lib/demo-smoke.test.ts
cd /Users/user/Desktop/Frontend/frontend && npm run demo:smoke
```

Expected:

- backend contract test passes
- helper test passes
- smoke script exits `0` against a seeded local app

**Step 6: Commit**

```bash
git add backend/tests/test_demo_contracts.py frontend/src/lib/demo-smoke.ts frontend/src/lib/demo-smoke.test.ts frontend/scripts/demo-smoke.ts frontend/package.json docs/demo-rehearsal-checklist.md
git commit -m "test: add lightweight demo smoke coverage"
```

---

### Task 6: Polish Loading, Empty, and Error States Across the Remaining Demo Surfaces

**Files:**
- Modify: `frontend/src/app/assistant/page.tsx`
- Modify: `frontend/src/app/landlord/notifications/page.tsx`
- Modify: `frontend/src/app/landlord/ai-studio/page.tsx`
- Modify: `frontend/src/app/dashboard/page.tsx`
- Modify: `frontend/src/app/landlord/dashboard/new/page.tsx`
- Modify: `frontend/src/app/listings/[id]/page.tsx`
- Modify: `docs/demo-runbook.md`

**Step 1: Write a tiny acceptance checklist before editing UI copy**

Capture the exact states each page must support in comments or a short checklist before implementation:

- loading
- empty
- unauthorized
- degraded/fallback
- happy path

This keeps the polish pass bounded and reviewable.

**Step 2: Normalize copy and CTA behavior**

Update each page so the user always sees:

- what is happening
- whether the state is temporary or terminal
- what action to take next

Examples:

```ts
const EMPTY_ASSISTANT_COPY = "Ask for listings by city, budget, and term to get recommendations.";
const PIPELINE_FAILED_COPY = "The listing was created, but media generation did not finish. You can still use the listing and retry after the demo.";
```

**Step 3: Remove ambiguous placeholders**

Specifically remove wording that hides real state, such as:

- permanent sample notifications
- empty media regions with no explanation
- assistant errors that only say "Could not reach the assistant" without clarifying whether the rest of the dashboard still works

**Step 4: Update the runbook to match the final copy and fallback behavior**

Amend `docs/demo-runbook.md` so rehearsal instructions use the final page wording and operator fallbacks.

**Step 5: Verify the polish pass**

Run:

```bash
cd /Users/user/Desktop/Frontend/frontend && npx tsc --noEmit
```

Manual check:

1. Visit each page with seeded data
2. Visit each page after clearing or withholding the relevant data when possible
3. Confirm no state is visually blank or misleading

**Step 6: Commit**

```bash
git add frontend/src/app/assistant/page.tsx frontend/src/app/landlord/notifications/page.tsx frontend/src/app/landlord/ai-studio/page.tsx frontend/src/app/dashboard/page.tsx frontend/src/app/landlord/dashboard/new/page.tsx frontend/src/app/listings/[id]/page.tsx docs/demo-runbook.md
git commit -m "chore: polish remaining demo state messaging"
```

---

## Recommended Execution Order

1. Task 1: assistant history and contract repair
2. Task 2: landlord notifications data wiring
3. Task 3: fallback and processing-state hardening
4. Rehearse the full demo once
5. Task 4: AI Studio integration if time remains
6. Task 5: smoke coverage and rehearsal tooling
7. Task 6: copy/loading/error polish last, once behavior is stable

## Final Acceptance Checklist

- `/assistant` no longer depends on a missing backend endpoint
- Assistant history survives refresh
- Assistant responses can render recommendation cards without contract guessing
- Landlord notification bell and notifications page use derived real data
- Pipeline and assistant degraded states are explicit and operator-safe
- `AI Studio` uses real landlord assets rather than samples
- A lightweight smoke command exists for rehearsal
- The runbook and rehearsal checklist reflect the final product behavior
