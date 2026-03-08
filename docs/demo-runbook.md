# Demo Runbook

## Goal

Show a landlord-first flow:

1. Host logs in
2. Host creates a video listing
3. Listing appears in the landlord dashboard with processing state
4. Host opens a seeded flagship listing with AI-ranked matches
5. Host opens chat, sends a message, and shows a proposed or confirmed tour
6. Host previews the public listing page to show the gallery and highlight clip when available

## Preflight

From `/Users/user/Desktop/Frontend/frontend`:

```bash
npm install
npm run seed
npm run dev
```

Requirements:

- `.env.local` must contain `MONGODB_URI`
- Auth0 login must be configured
- Cloudinary credentials must be present for the browser upload and the async media-generation step:
  - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
- Pipeline credentials must be present if you want the live media-generation step

## Upload Flow

New landlord listing creation now uses a direct Cloudinary upload:

1. The browser requests a short-lived signed upload payload from `/api/uploads/cloudinary-sign`
2. The browser uploads the video directly to Cloudinary
3. The app receives the returned `videoPublicId` and creates the listing
4. The async pipeline starts from that Cloudinary asset

This replaces the old JSON/base64 transport path as the primary upload flow, so listing creation is no longer limited by the earlier local parser ceiling.

## Local Demo Shortcut

For local development only, you can bypass Auth0 with:

```text
/demo-login?user=jordan
```

That route sets a dev-only cookie for the seeded host and redirects to `/landlord/dashboard`.

## Demo Identity

- Primary host email: `jordan@landlord.com`
- Current-host binding works by email on first login, then stores the Auth0 subject on that host record
- The local demo shortcut uses the same seeded host email without mutating the stored Auth0 binding

## Seeded Demo Data

After `npm run seed`, the stable landlord demo record is:

- Listing: `Sunny Studio — Financial District`
- Host: `Jordan`
- Seeded matches: `Aisha Rahman`, `Chris Taylor`, `Sophia Martinez`
- Seeded tour states:
  - `Chris Taylor`: proposed tour
  - `Sophia Martinez`: confirmed tour

## Primary Demo Flow

1. Log in as the host and open `/landlord/dashboard`
2. Point out:
   - active listing count
   - total matches
   - unread messages
   - upcoming tours
3. Open `/landlord/dashboard/new`
4. Upload a property video and create a listing
5. Call out that the upload goes directly from the browser to Cloudinary before the listing is created
6. Return to `/landlord/dashboard`
7. Show that the new listing appears immediately and displays `Processing video`
8. Open the new listing detail page and show the processing banner
9. Switch to the seeded flagship listing `Sunny Studio — Financial District`
10. Show:
   - AI-ranked matches
   - match cards
   - proposed / confirmed tour states
11. Open `Sophia Martinez` or `Chris Taylor`
12. Send one message in the chat panel
13. If using `Chris Taylor`, propose tour times and then confirm one in the chat panel
14. Open `View public listing`
15. If the live pipeline finished, show the generated highlight clip on the public page

## Fallback Path

Use this if the live video pipeline does not finish in time:

1. Skip waiting for the newly created listing media to complete
2. Use the new listing only to show:
   - session-backed listing ownership
   - landlord dashboard appearance
   - processing-state UX
3. Move to the seeded flagship listing for:
   - ranked matches
   - persistent messaging
   - persistent tours
4. Call out that the public listing page is already wired to surface `highlightUrl` and `videoProcessing` as soon as async media is ready

## Fast Recovery

If the data gets messy during rehearsal:

```bash
cd /Users/user/Desktop/Frontend/frontend
npm run seed
```

Then refresh:

- `/landlord/dashboard`
- `/landlord/dashboard/<flagship-listing-id>`
- `/listings/<flagship-listing-id>`

## Page States Reference

### Assistant (`/assistant`)
- **Empty**: "Ask for listings by city, budget, and term to get recommendations."
- **Loading**: Thinking indicator in chat
- **Error**: "Could not reach the assistant. The rest of the dashboard still works."
- **Degraded**: Amber banner — "Showing demo fallback recommendations."
- **Happy**: Chat with history + listing recommendation cards

### Landlord Dashboard (`/landlord/dashboard`)
- **Empty**: "You do not have any listings yet."
- **Loading**: Skeleton listing cards
- **Error**: "Could not load your listings right now."
- **Happy**: Stats + listing grid + notification bell with real data

### Landlord Notifications (`/landlord/notifications`)
- **Empty**: "Notifications will appear when tenants match, message, or request tours."
- **Loading**: Skeleton notification rows
- **Error**: "Could not load notifications right now."
- **Happy**: Derived notification feed from live data

### Listing Detail (`/listings/[id]`)
- **Processing**: "Media is being processed" banner
- **Failed**: "Media generation did not complete" message
- **Happy**: Full listing with gallery + video tour

### AI Studio (`/landlord/ai-studio`)
- **Loading**: "Loading your listing photos..."
- **No media**: Falls back to sample images with note
- **Happy**: Real listing images with AI transform comparison

## Known Demo Notes

- The repo still has some existing `no-img-element` lint warnings in older UI files
- The previous TypeScript blocker in `create-profile/page.tsx` was removed while fixing routing
- The strongest live story is:
  - create listing
  - show processing
  - pivot to seeded matches and tours
  - return to the public listing page if the highlight clip is ready
