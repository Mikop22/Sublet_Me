# SubletMe

**AI-powered student housing — upload a video, we do the rest.**

SubletMe is a student sublet marketplace that uses **agentic AI pipelines** to transform a raw apartment walkthrough video into a fully enriched listing — complete with curated gallery photos, highlight clips, professional copy, and intelligent tenant matching — in minutes, not hours.

Built for the Cloudinary + Backboard hackathon tracks.

---

## The Problem

Listing a sublet sucks. Students subletting their apartments for co-op terms have to take photos, write descriptions, figure out pricing language, and manually sift through inquiries. Most listings end up with bad photos and a one-line description.

**SubletMe flips the script:** landlords upload a single video walkthrough, and our AI agent pipeline handles everything else.

---

## How It Works

### For Landlords: Video-First Listing Creation

1. **Upload a video walkthrough** — just walk through your apartment with your phone
2. **Our AI pipeline takes over:**
   - Extracts frames, tags them with computer vision, selects the best gallery photos
   - Generates a branded highlight clip
   - Writes the listing title, description, amenities, and neighborhood copy
   - Estimates beds, baths, sqft, and property type from the video
3. **Manage everything from the dashboard** — matches, messages, tours

### For Students: AI-Powered Discovery

1. **Create a profile** with lifestyle preferences, budget, and location
2. **Get AI-ranked matches** — scored on lifestyle compatibility, budget fit, and location
3. **Chat with the AI assistant** to search listings by natural language
4. **Message landlords and schedule tours** directly in the app

---

## Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│   Next.js    │────▶│   Cloudinary     │     │   Backboard.io      │
│   Frontend   │     │                  │     │   Agent Platform     │
│              │     │  • Video upload   │     │                     │
│  • Dashboard │     │  • Frame extract  │     │  • Curator Agent    │
│  • Listings  │     │  • AI tagging     │     │  • Reviewer Agent   │
│  • Chat      │     │  • Highlight clip │     │  • Copywriter Agent │
│  • Assistant │     │  • Transforms     │     │  • Assistant Agent   │
└──────┬───────┘     └──────────────────┘     └─────────────────────┘
       │
       ▼
┌──────────────┐     ┌──────────────────┐
│   MongoDB    │     │   Auth0          │
│              │     │                  │
│  • Listings  │     │  • SSO login     │
│  • Users     │     │  • Session mgmt  │
│  • Matches   │     │  • Route protect │
│  • Messages  │     │                  │
│  • Tours     │     │                  │
└──────────────┘     └──────────────────┘
```

---

## Cloudinary Integration (Deep Dive)

Cloudinary is the backbone of our entire media pipeline. We use it far beyond simple uploads — it powers every step from raw video to polished listing.

### 1. Direct Browser Upload with Signed Payloads

Listing videos upload **directly from the browser to Cloudinary** — no server relay, no file size ceiling from Next.js body limits.

```
Browser → POST /api/uploads/cloudinary-sign → signed payload
Browser → POST https://api.cloudinary.com/v1_1/.../video/upload → Cloudinary
Browser → receives videoPublicId → creates listing via API
```

The server generates a short-lived signature (`CLOUDINARY_API_SECRET`), and the browser uses it to upload directly. This keeps the server stateless and fast.

### 2. Intelligent Frame Extraction

We extract frames at calculated intervals across the video duration using Cloudinary's **video-to-image transformations**:

```typescript
// High-res gallery frame (1920x1080, upscaled, auto-gravity)
cloudinary.url(publicId, {
  resource_type: "video",
  format: "jpg",
  transformation: [
    { start_offset: timestamp },
    { width: 1920, height: 1080, crop: "fill", gravity: "auto" },
    { effect: "upscale" },
    { quality: "auto", fetch_format: "auto" },
  ],
});
```

No video download. No ffmpeg. The frames are generated **on-the-fly** via Cloudinary URL transformations.

### 3. AI Content Tagging (COCO Detection)

Each extracted frame is re-uploaded temporarily to Cloudinary with **AI auto-tagging**:

```typescript
const tagResult = await cloudinary.uploader.upload(frame.thumbnailUrl, {
  detection: "coco",
  auto_tagging: 0.5,
});
// Returns: ["couch", "dining table", "potted plant", "tv", ...]
```

These tags feed into the Curator and Copywriter agents, giving them structured visual context about each room.

### 4. Branded Highlight Clip

We generate an 8-second preview clip using Cloudinary's `e_preview` effect with auto-crop:

```typescript
cloudinary.url(publicId, {
  resource_type: "video",
  format: "mp4",
  transformation: [
    { effect: "preview:duration_8" },
    { width: 1200, height: 675, crop: "fill", gravity: "auto" },
    { quality: "auto", fetch_format: "auto" },
  ],
});
```

The highlight clip is displayed on the public listing page with branded text overlays (listing title + price), all composed via Cloudinary transformations — no video editing software required.

### 5. AI Studio (Bonus)

The landlord AI Studio page lets hosts preview Cloudinary's on-the-fly image transformations on their real listing photos — artistic filters, enhancements, and crops — powered by the same gallery images the pipeline generated.

---

## Backboard.io Integration (Deep Dive)

Backboard powers our **multi-agent orchestration pipeline** — three specialized AI assistants that collaborate to transform raw video frames into a polished listing. Each agent has a persistent identity, system prompt, and memory via the Backboard platform.

### Agent 1: Listing Photo Curator

**Purpose:** Select the 5-6 best frames from the video for the listing gallery.

**How it works:**
- Receives all extracted frames with their Cloudinary AI tags and timestamps
- Selects frames that cover different rooms (kitchen, living, bedroom, bathroom, view)
- Designates a hero image (the thumbnail shown in search results)
- Spaces selections across the video timeline for maximum room variety
- Labels each selected frame with a room description

```
Input:  "Frame 3 (8s): Tags: [couch, tv, potted plant] | URL: ..."
Output: { selected: [2, 4, 6, 8, 10], hero: 4, labels: { "4": "Living room" }, reasoning: "..." }
```

### Agent 2: Gallery Reviewer

**Purpose:** Quality-check the Curator's selections and request improvements.

**How it works:**
- Reviews the selected frames against quality criteria (room variety, lighting, composition)
- Returns `approved` or `retry` with specific feedback
- If rejected, the Curator re-selects with **double the frames** (10 → 20 → 40) and incorporates the feedback
- After 3 rounds, the Reviewer picks the best round overall

This **Curator → Reviewer feedback loop** (up to 3 rounds) ensures gallery quality without human intervention.

```
Round 1: 10 frames → Curator selects 6 → Reviewer: "retry — missing kitchen"
Round 2: 20 frames → Curator selects 6 → Reviewer: "approved"
```

### Agent 3: Listing Copywriter

**Purpose:** Generate professional listing copy from the visual analysis.

**How it works:**
- Receives the Curator's selected frames, room labels, detected tags, and listing metadata
- Generates: title, description, amenities list, neighborhood summary
- Estimates: property type, beds, baths, and square footage from what's visible
- Writes for a student audience — warm, informative, concise

```
Input:  Selected frames with tags + "123 College St, Toronto" + "$1200/mo"
Output: {
  title: "Sun-Drenched Studio Steps from U of T",
  description: "A bright, fully furnished studio with floor-to-ceiling windows...",
  amenities: ["Furnished", "In-unit laundry", "Air conditioning", "Natural light", ...],
  neighborhood: "Located in the heart of the University district...",
  type: "Studio", beds: 1, baths: 1, sqft: 520
}
```

### The Full Agent Pipeline

```
Video Upload
    │
    ▼
┌─────────────────────┐
│  Cloudinary          │
│  Frame Extraction    │──── 10-40 frames with AI tags
│  + COCO Detection    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐     ┌─────────────────────┐
│  Backboard:         │◄───▶│  Backboard:          │
│  Curator Agent      │     │  Reviewer Agent      │
│                     │     │                      │
│  Selects best 5-6   │     │  Validates quality   │
│  frames for gallery  │     │  Requests retry if   │
│                     │     │  insufficient         │
└──────────┬──────────┘     └─────────────────────┘
           │                    ▲        │
           │ retry + feedback   │        │ approved
           └────────────────────┘        │
                                         ▼
                              ┌─────────────────────┐
                              │  Backboard:          │
                              │  Copywriter Agent    │
                              │                      │
                              │  Generates title,    │
                              │  description,        │
                              │  amenities, type,    │
                              │  beds/baths/sqft     │
                              └──────────┬──────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │  MongoDB Update      │
                              │                      │
                              │  Gallery images,     │
                              │  highlight clip,     │
                              │  generated copy,     │
                              │  enrichment status   │
                              └─────────────────────┘
```

### Backboard Thread API Usage

Each agent interaction uses Backboard's thread-based API:

```typescript
// 1. Create a new thread for this agent
const threadId = await createThread(assistantId);

// 2. Send the prompt and get the response
const response = await sendMessage(threadId, prompt);

// 3. Parse the structured JSON response
const result = JSON.parse(response.match(/\{[\s\S]*\}/)[0]);
```

Agents use `memory: "Auto"` so Backboard handles context management across messages within a thread.

---

## Agentic Tenant Matching

SubletMe uses an **AI-driven matching engine** that scores tenant-listing compatibility on a 0-100 scale with explainable reasoning.

### How Matching Works

Each match is computed across multiple dimensions:

| Dimension | Weight | Example |
|-----------|--------|---------|
| **Lifestyle compatibility** | High | Shared tags: "Night owl", "Fitness lover" |
| **Budget fit** | High | Tenant budget $900/mo vs listing $850/mo |
| **Location preference** | Medium | Tenant wants downtown Toronto, listing is in Liberty Village |
| **Term alignment** | Medium | Both looking for Summer 2025 |
| **University proximity** | Low | Listing near UofT, tenant attends UofT |

### Explainable Match Reasons

Every match includes human-readable reasons so tenants understand **why** a listing was recommended:

```json
{
  "score": 94,
  "sharedTags": ["Night owl", "Fitness lover"],
  "reasons": [
    { "label": "Lifestyle match", "matched": true, "detail": "2 shared lifestyle tags" },
    { "label": "Budget fit", "matched": true, "detail": "Under your $900/mo budget" },
    { "label": "Location", "matched": true, "detail": "In your preferred city" },
    { "label": "Pet policy", "matched": false, "detail": "No pets allowed" }
  ]
}
```

### Match-Powered Features

- **Landlord Dashboard:** Student match cards ranked by AI score with shared lifestyle tags highlighted
- **Student Dashboard:** Top picks carousel sorted by match percentage
- **Listing Pages:** Match score badge + compatibility breakdown
- **Notifications:** Landlords receive alerts when high-scoring tenants match their listings

---

## AI Listings Assistant

The conversational assistant lets students search for housing using natural language instead of filters.

### How It Works

```
Student: "Find me a place in Toronto under $900 for Summer 2025"
    │
    ▼
┌─────────────────────┐
│  SubletOps Backend   │
│  (FastAPI + LLM)     │
│                      │
│  • Parses intent     │
│  • Queries listings  │
│  • Ranks by match    │
│  • Generates response│
└──────────┬──────────┘
           │
           ▼
Assistant: "I found 6 listings that match your criteria..."
           + [Listing cards with scores and reasons]
```

### Features

- **Session-based conversation history** — context carries across messages
- **Listing recommendation cards** — clickable links to full listing pages with match scores
- **Graceful degradation** — falls back to deterministic search if the LLM backend is unavailable, with an amber banner noting fallback mode
- **BFF architecture** — Next.js API routes proxy to FastAPI backend, injecting auth context server-side

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16, React 19, TypeScript |
| **Styling** | Tailwind CSS 4, Framer Motion |
| **Database** | MongoDB Atlas + Mongoose |
| **Auth** | Auth0 (SSO + session management) |
| **Video/Media** | Cloudinary (upload, transform, AI tagging, streaming) |
| **AI Agents** | Backboard.io (Curator, Reviewer, Copywriter assistants) |
| **AI Assistant** | FastAPI + LLM backend (SubletOps) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas cluster (or local MongoDB)
- Cloudinary account
- Backboard.io account with API key

### Setup

```bash
cd frontend
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

```env
# Database
MONGODB_URI=mongodb+srv://...

# Auth
AUTH0_DOMAIN=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=
AUTH0_SECRET=          # openssl rand -hex 32
APP_BASE_URL=http://localhost:3000

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Backboard AI Agents
BACKBOARD_API_KEY=
CURATOR_ASSISTANT_ID=
REVIEWER_ASSISTANT_ID=
COPYWRITER_ASSISTANT_ID=

# SubletOps Backend (optional)
SUBLETOPS_BACKEND_URL=http://localhost:8000
```

### Seed Demo Data

```bash
npm run seed
```

This populates MongoDB with 5 landlords, 7 tenants, 41 Toronto listings, pre-computed matches, conversations, and tour schedules.

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo Shortcut

Skip Auth0 for local development:

```
http://localhost:3000/demo-login?user=jordan
```

This sets a dev-only cookie for the seeded host (Jordan) and redirects to the landlord dashboard.

### Run the Video Pipeline

To process the flagship listing with the full AI pipeline:

```bash
npx tsx scripts/run-pipeline-flagship.ts
```

This uploads `test.mp4` to Cloudinary, runs the Curator → Reviewer → Copywriter agent loop, and updates the listing with generated gallery images, highlight clip, and professional copy.

---

## Key Pages

| Page | Description |
|------|-------------|
| `/` | Landing page |
| `/dashboard` | Student dashboard with AI-ranked listings |
| `/assistant` | Conversational listing search |
| `/listings/[id]` | Public listing with gallery, video tour, host info |
| `/landlord/dashboard` | Landlord hub — listings, stats, notifications |
| `/landlord/dashboard/new` | Create listing (video upload) |
| `/landlord/dashboard/[id]` | Manage matches, chat, schedule tours |
| `/landlord/ai-studio` | Preview Cloudinary transforms on listing photos |
| `/create-profile` | Student onboarding (4-step flow) |

---

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/pipeline/process` | POST | Create listing + trigger AI video pipeline |
| `/api/uploads/cloudinary-sign` | POST | Generate signed Cloudinary upload payload |
| `/api/landlord/listings` | GET | Fetch host's listings |
| `/api/landlord/listings/[id]` | GET/DELETE | Listing detail / delete listing |
| `/api/landlord/listings/[id]/matches` | GET | AI-ranked matches for listing |
| `/api/landlord/conversations/[id]/messages` | POST | Send message |
| `/api/landlord/tours` | POST | Propose or confirm tour |
| `/api/landlord/notifications` | GET | Derived notification feed |
| `/api/landlord/ai-studio` | GET | Listing assets for AI Studio |
| `/api/listings` | GET | Public listing search |
| `/api/listings/[id]` | GET | Public listing detail |
| `/api/subletops/turn` | GET/POST | AI assistant conversation |
| `/api/auth/profile` | GET | Current user profile |

---

## What Makes This Different

1. **Video-first, not photo-first.** One video replaces 10 photos + a description. The AI pipeline does the rest.
2. **Multi-agent quality loop.** The Curator-Reviewer feedback loop (up to 3 rounds with progressive frame extraction) ensures gallery quality without human review.
3. **End-to-end AI enrichment.** From raw video → tagged frames → curated gallery → generated copy → tenant matching, every step is automated.
4. **Graceful degradation everywhere.** Pipeline fails? Listing still works. Backend down? Assistant shows fallback results. No media? Placeholder with status message.
5. **Built for the demo.** 41 seeded listings, pre-computed matches, real conversations and tours — the product feels lived-in from the first click.

---

## Team

Built at the Cloudinary x Backboard Hackathon, March 2026.
