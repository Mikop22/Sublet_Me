# Hackathon Demo P0 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver a demo-ready landlord-first flow where a logged-in host creates a video-based listing, the async AI pipeline generates media, the listing appears in the landlord dashboard, and the host can open the listing, review seeded matches, and show a persistent message/tour flow.

**Architecture:** Keep the existing async pipeline intact and move the landlord experience off `landlord-mock` onto Mongo-backed API routes. Use deterministic seeded `User`, `Listing`, `Match`, `Conversation`, and `Tour` records so the demo is reliable even if live matching logic is not finished. Surface `videoProcessing`, generated `images`, and `highlightUrl` through both landlord and public listing endpoints.

**Tech Stack:** Next.js 16 App Router, TypeScript, React 19, Mongoose/MongoDB, Auth0, Cloudinary, existing seed script

---

## Scope Guardrails

- Do not expand assistant/orchestrator scope in this plan. Assistant work is P1.
- Do not build a general-purpose marketplace backend. Build the minimum API surface needed for the landlord demo.
- Prefer seeded, deterministic match/chat/tour data over incomplete live ranking logic.
- Preserve the existing pipeline implementation in `frontend/src/lib/pipeline.ts`; only wire it into visible product surfaces.

## Demo Acceptance Criteria

1. A logged-in host can open `/landlord/dashboard/new`, upload a video, and submit a listing.
2. The created listing is stored under the current host instead of the hardcoded demo ObjectId.
3. The new listing appears on `/landlord/dashboard`.
4. The landlord detail page for that listing loads from MongoDB and shows requirements plus demo-compatible match data.
5. After the pipeline completes, generated gallery images and a highlight clip are visible in the UI.
6. The demo host can open one seeded conversation, send a message, and show a proposed or confirmed tour that survives refresh.
7. Host onboarding routes hosts to `/landlord/dashboard`, not `/dashboard`.
8. The entire flow can be reset with the seed script and re-run reliably.

---

### Task 1: Lock Host Identity and Protect Landlord Routes

**Files:**
- Create: `frontend/src/lib/current-host.ts`
- Modify: `frontend/src/app/api/pipeline/process/route.ts`
- Modify: `frontend/src/middleware.ts`
- Modify: `frontend/scripts/seed.ts`

**Step 1: Create a reusable current-host resolver**

Implement `frontend/src/lib/current-host.ts` with a server-only helper that:

- Reads the Auth0 session with `auth0.getSession()`
- Rejects if there is no session or no email
- Looks up `User` by `auth0Id`
- Falls back to `email` for seeded demo users
- If the lookup succeeds by email and `auth0Id` is missing, updates that user record with `session.user.sub`
- Rejects if the resolved user is not a `host`

Export a function with this shape:

```ts
export async function requireCurrentHost(): Promise<{
  _id: string;
  email: string;
  auth0Id?: string;
  name: string;
}>;
```

**Step 2: Replace the hardcoded host ID in the pipeline route**

In `frontend/src/app/api/pipeline/process/route.ts`:

- Import `requireCurrentHost`
- Resolve the current host before `Listing.create(...)`
- Replace:

```ts
hostId: new mongoose.Types.ObjectId("000000000000000000000001")
```

with:

```ts
hostId: new mongoose.Types.ObjectId(host._id)
```

- Return `401` for unauthenticated requests
- Return `403` if the session user is not a host

**Step 3: Protect landlord pages in middleware**

Update `frontend/src/middleware.ts`:

- Add `"/landlord"` to `PROTECTED_PATHS`
- Keep the existing Auth0 redirect flow
- Verify nested landlord routes like `/landlord/dashboard/new` and `/landlord/dashboard/[listingId]` are protected by the existing prefix logic

**Step 4: Seed a demo host that can be bound to Auth0**

Update `frontend/scripts/seed.ts` so the primary demo host:

- Has a stable email used during the demo
- Has `role: "host"`
- Can be found by email even before `auth0Id` is assigned

Do not hardcode an Auth0 subject in the seed; rely on first-login binding through `requireCurrentHost()`.

**Step 5: Verify the identity and auth changes**

Run:

```bash
cd /Users/user/Desktop/Frontend/frontend && npm run lint
cd /Users/user/Desktop/Frontend/frontend && npx tsc --noEmit
```

Expected:

- ESLint passes
- TypeScript exits cleanly

Manual check:

- Open `/landlord/dashboard` while logged out and confirm redirect to `/api/auth/login`
- Log in as the demo host and confirm `/landlord/dashboard/new` loads

**Step 6: Commit**

```bash
git add frontend/src/lib/current-host.ts frontend/src/app/api/pipeline/process/route.ts frontend/src/middleware.ts frontend/scripts/seed.ts
git commit -m "feat: bind landlord flows to current host session"
```

---

### Task 2: Replace Landlord Dashboard Mock Data with MongoDB Data

**Files:**
- Create: `frontend/src/app/api/landlord/listings/route.ts`
- Create: `frontend/src/lib/landlord-types.ts`
- Modify: `frontend/src/app/landlord/dashboard/page.tsx`
- Modify: `frontend/src/components/landlord/LandlordListingCard.tsx`

**Step 1: Create shared landlord-facing response types**

Create `frontend/src/lib/landlord-types.ts`:

```ts
export type LandlordListingSummary = {
  id: string;
  title: string;
  address: string;
  price: number;
  dates: string;
  image: string | null;
  status: "active" | "paused" | "filled";
  matches: number;
  views: number;
  inquiries: number;
  videoProcessing: boolean;
  highlightUrl: string;
};
```

Add any companion types needed for the dashboard totals payload.

**Step 2: Create a current-host listings API**

Implement `frontend/src/app/api/landlord/listings/route.ts` to:

- Resolve the current host with `requireCurrentHost()`
- Query `Listing.find({ hostId: currentHostId })`
- Sort newest first
- Return:
  - `listings: LandlordListingSummary[]`
  - `totals: { activeListings, totalMatches, unreadMessages, upcomingTours }`

For `totalMatches`, `unreadMessages`, and `upcomingTours`, use seeded `Match`, `Conversation`, and `Tour` collections if present. Do not compute from mocks.

**Step 3: Migrate the landlord dashboard page to fetch the new API**

Update `frontend/src/app/landlord/dashboard/page.tsx`:

- Remove imports from `@/lib/landlord-mock`
- Fetch `/api/landlord/listings`
- Drive stat cards and listing cards from API state
- Keep the existing visual design
- Show loading and empty states

**Step 4: Update the listing card component for string IDs and processing state**

Update `frontend/src/components/landlord/LandlordListingCard.tsx` to:

- Accept `id: string`
- Route to `/landlord/dashboard/${listing.id}`
- Display a lightweight “Processing video” badge or copy when `videoProcessing` is true
- Keep pause/delete controls behind the existing UI, but do not spend P0 time making full pause/delete persistence work unless it is needed for the demo script

**Step 5: Verify the dashboard migration**

Run:

```bash
cd /Users/user/Desktop/Frontend/frontend && npm run seed
cd /Users/user/Desktop/Frontend/frontend && npm run lint
cd /Users/user/Desktop/Frontend/frontend && npx tsc --noEmit
```

Expected:

- Seed completes without Mongoose validation failures
- Dashboard renders seeded landlord listings from MongoDB
- Newly created listings appear on refresh

Manual check:

- Create a new video listing
- Return to `/landlord/dashboard`
- Confirm the listing appears without relying on `landlord-mock`

**Step 6: Commit**

```bash
git add frontend/src/app/api/landlord/listings/route.ts frontend/src/lib/landlord-types.ts frontend/src/app/landlord/dashboard/page.tsx frontend/src/components/landlord/LandlordListingCard.tsx
git commit -m "feat: back landlord dashboard with database listings"
```

---

### Task 3: Add Real Landlord Listing Detail, Seeded Matches, and Persistent Chat/Tour Data

**Files:**
- Create: `frontend/src/app/api/landlord/listings/[listingId]/route.ts`
- Create: `frontend/src/app/api/landlord/listings/[listingId]/matches/route.ts`
- Create: `frontend/src/app/api/landlord/conversations/[conversationId]/messages/route.ts`
- Create: `frontend/src/app/api/landlord/tours/route.ts`
- Modify: `frontend/scripts/seed.ts`
- Modify: `frontend/src/app/landlord/dashboard/[listingId]/page.tsx`
- Modify: `frontend/src/components/landlord/ChatPanel.tsx`
- Modify: `frontend/src/components/landlord/TourModal.tsx`
- Modify: `frontend/src/components/landlord/RequirementsPanel.tsx`

**Step 1: Extend the seed script with deterministic matches, conversations, and tours**

Update `frontend/scripts/seed.ts` so it creates:

- At least 3 matched tenants for one flagship landlord listing
- A `Conversation` for at least 2 of those matches
- One `Tour` in `proposed` state
- One `Tour` in `confirmed` state with a stable Meet URL

Use the existing `Match`, `Conversation`, and `Tour` models. Keep the data tied to specific seeded listing IDs and tenant IDs so the demo script is stable.

**Step 2: Create a landlord listing-detail API**

Implement `frontend/src/app/api/landlord/listings/[listingId]/route.ts` to return:

- Listing summary
- Requirements
- `videoProcessing`
- `highlightUrl`
- Gallery images

Only return listings owned by the current host.

**Step 3: Create a landlord matches API**

Implement `frontend/src/app/api/landlord/listings/[listingId]/matches/route.ts` to return:

- Ranked matched students
- Their shared tags
- Conversation ID if one exists
- Latest tour state if one exists

Shape the response to match the current `StudentMatchCard` needs so the UI migration is mechanical.

**Step 4: Create minimal write APIs for messages and tours**

Implement:

- `POST /api/landlord/conversations/[conversationId]/messages`
- `POST /api/landlord/tours`

Behavior:

- Message route appends a message to an existing conversation and updates unread counts
- Tours route stores proposed slots and writes a paired “tour proposal” message into the conversation
- Confirmed seeded tours remain readable without requiring a live student-side acceptance flow

This is the minimum persistence needed so the demo survives refresh.

**Step 5: Migrate the landlord detail page**

Update `frontend/src/app/landlord/dashboard/[listingId]/page.tsx` to:

- Remove `@/lib/landlord-mock`
- Fetch landlord listing detail and matches from the new APIs
- Pass real conversation/tour data into `ChatPanel`
- Preserve the existing UI layout

**Step 6: Update the chat and tour components**

Update `frontend/src/components/landlord/ChatPanel.tsx` and `TourModal.tsx` to:

- Read initial messages from API payload instead of `CONVERSATIONS`
- Post new messages to the message route
- Post tour proposals to the tours route
- Show confirmed seeded tours on first load

Keep local optimistic state, but always re-sync after writes.

**Step 7: Verify the landlord detail and persistence flow**

Run:

```bash
cd /Users/user/Desktop/Frontend/frontend && npm run seed
cd /Users/user/Desktop/Frontend/frontend && npm run lint
cd /Users/user/Desktop/Frontend/frontend && npx tsc --noEmit
```

Manual check:

1. Open a seeded landlord listing detail page
2. Confirm matched students render from DB data
3. Open one seeded conversation
4. Send a message
5. Propose tour slots
6. Refresh the page and confirm the conversation/tour state persists

**Step 8: Commit**

```bash
git add frontend/scripts/seed.ts frontend/src/app/api/landlord/listings/[listingId]/route.ts frontend/src/app/api/landlord/listings/[listingId]/matches/route.ts frontend/src/app/api/landlord/conversations/[conversationId]/messages/route.ts frontend/src/app/api/landlord/tours/route.ts frontend/src/app/landlord/dashboard/[listingId]/page.tsx frontend/src/components/landlord/ChatPanel.tsx frontend/src/components/landlord/TourModal.tsx frontend/src/components/landlord/RequirementsPanel.tsx
git commit -m "feat: wire landlord detail to seeded matches conversations and tours"
```

---

### Task 4: Surface Pipeline Output and Processing State in the UI

**Files:**
- Modify: `frontend/src/app/api/listings/[id]/route.ts`
- Modify: `frontend/src/app/api/listings/route.ts`
- Modify: `frontend/src/app/landlord/dashboard/[listingId]/page.tsx`
- Modify: `frontend/src/app/listings/[id]/page.tsx`

**Step 1: Extend the public listing API response**

Update `frontend/src/app/api/listings/[id]/route.ts` to return:

- `videoPublicId`
- `highlightUrl`
- `videoProcessing`

Also expose them in the TypeScript type consumed by `frontend/src/app/listings/[id]/page.tsx`.

Use this mapping:

```ts
videoTour: doc.highlightUrl || "",
videoPublicId: doc.videoPublicId || "",
videoProcessing: Boolean(doc.videoProcessing),
```

**Step 2: Extend the list API for summaries**

Update `frontend/src/app/api/listings/route.ts` so list items also include:

- `videoProcessing`
- `highlightUrl`

This allows the dashboard and any future public lists to show pipeline status without another round trip.

**Step 3: Show processing and completion state in landlord detail**

Update `frontend/src/app/landlord/dashboard/[listingId]/page.tsx` to:

- Show a banner while `videoProcessing` is true
- Show the generated lead image once `images.length > 0`
- Optionally link to the public listing page for the polished gallery/video view

Keep the page useful before the pipeline completes.

**Step 4: Render the generated highlight clip in the public listing page**

Update `frontend/src/app/listings/[id]/page.tsx` to:

- Treat `highlightUrl` as the canonical video source for `VideoTourSection`
- Render the video section whenever `highlightUrl` is non-empty
- Show a temporary “video processing” message if `videoProcessing` is true and `highlightUrl` is still empty

**Step 5: Verify pipeline visibility**

Run:

```bash
cd /Users/user/Desktop/Frontend/frontend && npm run lint
cd /Users/user/Desktop/Frontend/frontend && npx tsc --noEmit
```

Manual check:

1. Create a new video listing
2. Confirm the landlord dashboard/detail show “processing” state immediately
3. Wait for pipeline completion
4. Refresh the detail and public listing pages
5. Confirm generated images and highlight clip are visible

**Step 6: Commit**

```bash
git add frontend/src/app/api/listings/[id]/route.ts frontend/src/app/api/listings/route.ts frontend/src/app/landlord/dashboard/[listingId]/page.tsx frontend/src/app/listings/[id]/page.tsx
git commit -m "feat: surface pipeline media and processing state in listing views"
```

---

### Task 5: Fix Host Onboarding Routing and Publish the Demo Runbook

**Files:**
- Modify: `frontend/src/app/create-profile/shared-components.tsx`
- Modify: `frontend/src/app/create-profile/page.tsx`
- Create: `docs/demo-runbook.md`

**Step 1: Fix the shared success screen**

Update `frontend/src/app/create-profile/shared-components.tsx` so host-oriented flows do not always link to `/dashboard`.

Either:

- Make `SuccessScreen` accept a `dashboardPath` prop, or
- Split the host and tenant success CTA behavior explicitly

**Step 2: Pass the correct route from onboarding**

Update `frontend/src/app/create-profile/page.tsx` so:

- `tenant` continues to route to `/dashboard`
- `host` routes to `/landlord/dashboard`

If the shortcut host flow under `create-profile/list-place` is still used in demo prep, apply the same fix there.

**Step 3: Create the demo runbook**

Create `docs/demo-runbook.md` with:

- Required env vars
- `npm run seed`
- Demo host login identity
- Happy-path demo clicks
- Fallback branch if the live pipeline is still processing
- Fallback branch if Cloudinary or Backboard is unavailable

Use the exact flow:

1. Log in as seeded host
2. Open landlord dashboard
3. Create video listing
4. Show processing state
5. Open seeded flagship listing for ranked matches and persistent chat/tour
6. Open public listing page for generated gallery/highlight

**Step 4: Final verification**

Run:

```bash
cd /Users/user/Desktop/Frontend/frontend && npm run seed
cd /Users/user/Desktop/Frontend/frontend && npm run lint
cd /Users/user/Desktop/Frontend/frontend && npx tsc --noEmit
```

Manual end-to-end smoke:

1. Log in as host
2. Create a listing with a video
3. Confirm it appears in landlord dashboard
4. Open landlord detail
5. Open a seeded chat and proposed/confirmed tour
6. Open public listing page and confirm media output
7. Complete the same flow again from a reseeded DB

**Step 5: Commit**

```bash
git add frontend/src/app/create-profile/shared-components.tsx frontend/src/app/create-profile/page.tsx docs/demo-runbook.md
git commit -m "docs: add demo runbook and fix host onboarding route"
```

---

## Execution Notes

- Execute tasks in order. Task 1 is a hard dependency for Task 2 and Task 3.
- Do not start Task 3 until Task 2 is rendering MongoDB-backed landlord listings successfully.
- Do not spend time on assistant/history fixes during this plan.
- If live pipeline latency becomes a demo risk, seed at least one completed pipeline listing and use the newly created listing only to show the “processing” state.

## Final Demo Checklist

- `npm run seed` works
- `/landlord/*` requires auth
- New listings bind to the current host
- Dashboard shows DB listings
- Landlord detail shows DB listing + seeded matches
- Chat/tour survives refresh
- Generated media is visible after pipeline completion
- Host onboarding lands in landlord dashboard

