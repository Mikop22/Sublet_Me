# Video Pipeline Frontend Integration

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire the multi-agent video-to-photos pipeline into the `/landlord/dashboard/new` form so landlords upload a video, click "Create Listing," and the pipeline runs async in the background populating the listing gallery.

**Architecture:** The new listing form replaces the image input with a video file picker. On submit, a new API route creates the listing in MongoDB immediately (with `videoProcessing: true`) and fires the pipeline function without awaiting it. The pipeline (ported from `scripts/test-pipeline.ts`) uploads to Cloudinary, runs the curator→reviewer loop, then patches the listing with the resulting image URLs.

**Tech Stack:** Next.js 14 App Router, Mongoose/MongoDB, Cloudinary v2 SDK, Backboard API, TypeScript

---

### Task 1: Extend Listing schema with video fields

**Files:**
- Modify: `frontend/src/models/Listing.ts`

**Step 1: Add video fields to the schema**

In `Listing.ts`, add these fields to `listingSchema` alongside the existing `images` field:

```ts
videoPublicId: { type: String, default: "" },
highlightUrl: { type: String, default: "" },
videoProcessing: { type: Boolean, default: false },
```

**Step 2: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors related to Listing model.

**Step 3: Commit**

```bash
git add frontend/src/models/Listing.ts
git commit -m "feat: add video fields to Listing schema"
```

---

### Task 2: Create pipeline library

**Files:**
- Create: `frontend/src/lib/pipeline.ts`

This ports the logic from `frontend/scripts/test-pipeline.ts` into a callable function that takes a video URL (Cloudinary public ID after upload) and a listing ID, runs the full curator→reviewer loop, and patches the listing in MongoDB when done.

**Step 1: Create `frontend/src/lib/pipeline.ts`**

```ts
import { v2 as cloudinary } from "cloudinary";
import { connectDB } from "@/lib/mongodb";
import { Listing } from "@/models/Listing";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const BB_KEY = process.env.BACKBOARD_API_KEY!;
const BB_BASE = "https://app.backboard.io/api";
const bbHeaders = { "X-API-Key": BB_KEY, "Content-Type": "application/json" };

const INITIAL_FRAMES = 10;
const MAX_FRAMES = 40;
const MAX_ROUNDS = 3;

type FrameData = {
  index: number;
  timestamp: number;
  imageUrl: string;
  thumbnailUrl: string;
  tags: string[];
};

type CuratorResult = {
  selected: number[];
  hero: number;
  labels: Record<string, string>;
  reasoning: string;
};

type ReviewResult = {
  verdict: "approved" | "retry";
  feedback: string;
};

type RoundResult = {
  round: number;
  numFrames: number;
  frames: FrameData[];
  curatorResult: CuratorResult;
  reviewResult: ReviewResult | null;
};

async function createThread(assistantId: string): Promise<string> {
  const res = await fetch(`${BB_BASE}/assistants/${assistantId}/threads`, {
    method: "POST",
    headers: bbHeaders,
  });
  const data = await res.json();
  return data.thread_id;
}

async function sendMessage(threadId: string, content: string): Promise<string> {
  const res = await fetch(`${BB_BASE}/threads/${threadId}/messages`, {
    method: "POST",
    headers: { "X-API-Key": BB_KEY },
    body: new URLSearchParams({ content, memory: "Auto", stream: "false" }),
  });
  const data = await res.json();
  return data.content;
}

function extractFrames(publicId: string, duration: number, numFrames: number): FrameData[] {
  const interval = duration / (numFrames + 1);
  return Array.from({ length: numFrames }, (_, i) => {
    const idx = i + 1;
    const timestamp = Math.round(interval * idx);
    const imageUrl = cloudinary.url(publicId, {
      resource_type: "video",
      format: "jpg",
      transformation: [
        { start_offset: timestamp },
        { width: 1920, height: 1080, crop: "fill", gravity: "auto" },
        { quality: "auto", fetch_format: "auto" },
      ],
    });
    const thumbnailUrl = cloudinary.url(publicId, {
      resource_type: "video",
      format: "jpg",
      transformation: [
        { start_offset: timestamp },
        { width: 400, height: 225, crop: "fill", gravity: "auto" },
        { quality: "auto" },
      ],
    });
    return { index: idx, timestamp, imageUrl, thumbnailUrl, tags: [] };
  });
}

async function tagFrames(frames: FrameData[]): Promise<void> {
  for (const frame of frames) {
    try {
      const result = await cloudinary.uploader.upload(frame.thumbnailUrl, {
        resource_type: "image",
        folder: "subletme/temp-frames",
        detection: "coco",
        auto_tagging: 0.5,
      });
      frame.tags = result.tags ?? [];
      await cloudinary.uploader.destroy(result.public_id);
    } catch {
      // tagging is best-effort
    }
  }
}

const CURATOR_PROMPT = `You are an expert real estate photographer for a student sublet platform.

You receive a list of video frames extracted from apartment tour videos. Each frame has:
- An index number
- A timestamp (seconds into the video)
- AI-detected content tags (may be empty)
- A thumbnail URL

Your job: Select the 5-6 BEST frames for a property listing photo gallery.

RULES:
1. ALWAYS select 5-6 frames, even if tags are empty. Use timestamp spacing to ensure variety.
2. Pick frames from different parts of the video (early, middle, late) to cover different rooms.
3. First selected frame = hero/thumbnail image — pick one from roughly 20-40% into the video (past the entry).
4. Avoid first and last frames (usually entry/exit).
5. Space selections at least 2 frames apart to avoid duplicate rooms.
6. If tags ARE available, use them to ensure room variety (kitchen, living, bedroom, bathroom, view).
7. If you receive feedback from a reviewer, incorporate it into your selection.

Return ONLY valid JSON with keys: selected (array of frame indices), hero (single index), labels (object mapping index to room guess), reasoning (one sentence).`;

const REVIEWER_PROMPT = `You are a quality assurance reviewer for a student sublet listing platform.

You review frame selections made by a Curator agent for apartment listing photo galleries.

EVALUATION CRITERIA:
1. ROOM DIVERSITY: Are at least 3 distinct room types represented?
2. NO DUPLICATES: Are any two selected frames within 5 seconds of each other?
3. TAG COVERAGE: If most frames had tags but selected ones don't, that's suspicious.
4. HERO QUALITY: Is the hero frame from roughly 20-40% into the video?
5. SPREAD: Are selections distributed across the video timeline?

SCORING:
- If 4-5 criteria pass: approve
- If 2-3 criteria fail: retry with specific feedback

Return ONLY valid JSON with keys: verdict ("approved" or "retry"), feedback (specific issues or "Looks good").`;

async function curate(
  curatorId: string,
  frames: FrameData[],
  feedback?: string
): Promise<CuratorResult> {
  const threadId = await createThread(curatorId);
  const frameList = frames
    .map(
      (f) =>
        `Frame ${f.index} (${f.timestamp}s): Tags: [${f.tags.join(", ") || "none"}] | URL: ${f.thumbnailUrl}`
    )
    .join("\n");

  let msg = `Select 5-6 best frames for a listing gallery:\n\n${frameList}`;
  if (feedback) msg += `\n\nReviewer feedback to address:\n"${feedback}"`;

  const response = await sendMessage(threadId, msg);
  try {
    const match = response.match(/\{[\s\S]*\}/);
    if (match) {
      const p = JSON.parse(match[0]);
      return {
        selected: p.selected ?? [],
        hero: p.hero ?? p.selected?.[0] ?? 0,
        labels: p.labels ?? {},
        reasoning: p.reasoning ?? "",
      };
    }
  } catch {}
  return { selected: [], hero: 0, labels: {}, reasoning: "parse failed" };
}

async function review(
  reviewerId: string,
  frames: FrameData[],
  curatorResult: CuratorResult,
  duration: number
): Promise<ReviewResult> {
  const threadId = await createThread(reviewerId);
  const selectedDetails = curatorResult.selected
    .map((idx) => {
      const f = frames.find((fr) => fr.index === idx);
      return f
        ? `Frame ${idx} (${f.timestamp}s) — "${curatorResult.labels[idx] ?? "unknown"}" — Tags: [${f.tags.join(", ") || "none"}]`
        : `Frame ${idx} — not found`;
    })
    .join("\n");

  const msg = `Review this gallery for a ${Math.round(duration)}s apartment tour video.
Frames available: ${frames.length} | Duration: ${Math.round(duration)}s

SELECTION (${curatorResult.selected.length} frames):
${selectedDetails}

Hero: Frame ${curatorResult.hero}
Curator reasoning: "${curatorResult.reasoning}"`;

  const response = await sendMessage(threadId, msg);
  try {
    const match = response.match(/\{[\s\S]*\}/);
    if (match) {
      const p = JSON.parse(match[0]);
      return {
        verdict: p.verdict === "approved" ? "approved" : "retry",
        feedback: p.feedback ?? "",
      };
    }
  } catch {}
  return { verdict: "approved", feedback: "auto-approved" };
}

async function pickBest(reviewerId: string, rounds: RoundResult[]): Promise<number> {
  const threadId = await createThread(reviewerId);
  const summaries = rounds
    .map(
      (r) =>
        `ROUND ${r.round} (${r.numFrames} frames): Selected [${r.curatorResult.selected.join(", ")}], feedback: "${r.reviewResult?.feedback ?? "N/A"}"`
    )
    .join("\n\n");

  const msg = `Pick the best round across ${rounds.length} curator attempts:\n\n${summaries}\n\nReturn ONLY JSON: { "best_round": N, "reasoning": "..." }`;
  const response = await sendMessage(threadId, msg);
  try {
    const match = response.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]).best_round ?? rounds.length;
  } catch {}
  return rounds.length;
}

/**
 * Main entry point. Called fire-and-forget from the API route.
 * Uploads video buffer to Cloudinary, runs multi-agent pipeline,
 * then patches the listing in MongoDB with the results.
 */
export async function runVideoPipeline(
  videoBuffer: Buffer,
  listingId: string
): Promise<void> {
  const curatorId = process.env.CURATOR_ASSISTANT_ID!;
  const reviewerId = process.env.REVIEWER_ASSISTANT_ID!;

  try {
    // 1. Upload video to Cloudinary
    const uploadResult = await new Promise<{ public_id: string; duration: number }>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: "video",
            folder: "subletme/listings",
            eager: [{ effect: "preview:duration_8" }],
            eager_async: true,
          },
          (err, result) => {
            if (err || !result) return reject(err);
            resolve({ public_id: result.public_id, duration: result.duration ?? 30 });
          }
        );
        stream.end(videoBuffer);
      }
    );

    const { public_id: publicId, duration } = uploadResult;

    const highlightUrl = cloudinary.url(publicId, {
      resource_type: "video",
      format: "mp4",
      transformation: [
        { effect: "preview:duration_8" },
        { width: 1200, height: 675, crop: "fill", gravity: "auto" },
        { quality: "auto", fetch_format: "auto" },
      ],
    });

    // 2. Curator–Reviewer loop
    const rounds: RoundResult[] = [];
    let numFrames = INITIAL_FRAMES;
    let approved = false;
    let feedback: string | undefined;

    for (let round = 1; round <= MAX_ROUNDS; round++) {
      const frames = extractFrames(publicId, duration, numFrames);
      await tagFrames(frames);

      const curatorResult = await curate(curatorId, frames, feedback);
      if (curatorResult.selected.length === 0) {
        numFrames = Math.min(numFrames * 2, MAX_FRAMES);
        rounds.push({ round, numFrames, frames, curatorResult, reviewResult: { verdict: "retry", feedback: "Empty selection" } });
        continue;
      }

      const reviewResult = await review(reviewerId, frames, curatorResult, duration);
      rounds.push({ round, numFrames, frames, curatorResult, reviewResult });

      if (reviewResult.verdict === "approved") {
        approved = true;
        break;
      }

      feedback = reviewResult.feedback;
      numFrames = Math.min(numFrames * 2, MAX_FRAMES);
    }

    // 3. Pick final round
    let finalRound = rounds[rounds.length - 1];
    if (!approved && rounds.length > 1) {
      const bestNum = await pickBest(reviewerId, rounds);
      finalRound = rounds[bestNum - 1] ?? finalRound;
    }

    const { curatorResult, frames } = finalRound;
    const galleryUrls = curatorResult.selected
      .map((idx) => frames.find((f) => f.index === idx)?.imageUrl)
      .filter(Boolean) as string[];

    // 4. Patch listing in MongoDB
    await connectDB();
    await Listing.findByIdAndUpdate(listingId, {
      images: galleryUrls,
      videoPublicId: publicId,
      highlightUrl,
      videoProcessing: false,
    });
  } catch (err) {
    console.error("[pipeline] failed for listing", listingId, err);
    await connectDB().catch(() => {});
    await Listing.findByIdAndUpdate(listingId, { videoProcessing: false }).catch(() => {});
  }
}
```

**Step 2: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add frontend/src/lib/pipeline.ts
git commit -m "feat: add video pipeline library"
```

---

### Task 3: Create the `/api/pipeline/process` API route

**Files:**
- Create: `frontend/src/app/api/pipeline/process/route.ts`

**Step 1: Create the route**

```ts
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Listing } from "@/models/Listing";
import { runVideoPipeline } from "@/lib/pipeline";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const video = formData.get("video") as File | null;
    if (!video) {
      return Response.json({ error: "No video provided" }, { status: 400 });
    }

    // Parse listing fields from FormData
    const title = formData.get("title") as string;
    const address = formData.get("address") as string;
    const city = (formData.get("city") as string) || "Toronto";
    const price = Number(formData.get("price"));
    const datesStart = formData.get("datesStart") as string;
    const datesEnd = formData.get("datesEnd") as string;
    const status = (formData.get("status") as string) || "active";
    const budgetMin = Number(formData.get("budgetMin"));
    const budgetMax = Number(formData.get("budgetMax"));
    const termPreference = formData.get("termPreference") as string;
    const petPolicy = (formData.get("petPolicy") as string) || "no-pets";
    const genderPreference =
      (formData.get("genderPreference") as string) || "no-preference";
    const occupants = Number(formData.get("occupants")) || 1;
    const referencesRequired = formData.get("referencesRequired") === "true";
    const lifestyleTags = JSON.parse(
      (formData.get("lifestyleTags") as string) || "[]"
    );

    // Placeholder hostId — replace with real auth session user ID when auth wired
    const PLACEHOLDER_HOST_ID = "000000000000000000000001";

    await connectDB();

    // Create listing immediately with processing flag
    const listing = await Listing.create({
      hostId: PLACEHOLDER_HOST_ID,
      title,
      address,
      city,
      price,
      dates: {
        start: new Date(datesStart || Date.now()),
        end: new Date(datesEnd || Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
      status,
      images: [],
      videoProcessing: true,
      requirements: {
        budgetMin,
        budgetMax,
        termPreference,
        petPolicy,
        genderPreference,
        occupants,
        referencesRequired,
        lifestyleTags,
      },
    });

    const listingId = listing._id.toString();

    // Buffer the video file
    const arrayBuffer = await video.arrayBuffer();
    const videoBuffer = Buffer.from(arrayBuffer);

    // Fire pipeline async — do NOT await
    runVideoPipeline(videoBuffer, listingId).catch((err) =>
      console.error("[pipeline] unhandled error:", err)
    );

    return Response.json({ listingId });
  } catch (err) {
    console.error("[/api/pipeline/process]", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
```

**Step 2: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add frontend/src/app/api/pipeline/process/route.ts
git commit -m "feat: add pipeline process API route"
```

---

### Task 4: Update the new listing form

**Files:**
- Modify: `frontend/src/app/landlord/dashboard/new/page.tsx`

**Step 1: Replace image state + handler with video state**

Remove all image-related state (`image`, `imagePreview`, `fileInputRef`, `handleImageUpload`) and add:

```ts
const [video, setVideo] = useState<File | null>(null);
const [videoPreview, setVideoPreview] = useState<string | null>(null);
const videoInputRef = useRef<HTMLInputElement>(null);
```

**Step 2: Update submit handler to POST FormData to the new route**

Replace the simulated `handleSubmit` with:

```ts
const [submitStage, setSubmitStage] = useState<"idle" | "uploading" | "done">("idle");

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);
  setSubmitStage("uploading");

  const fd = new FormData();
  if (video) fd.append("video", video);
  fd.append("title", title);
  fd.append("address", address);
  fd.append("price", String(price));
  fd.append("datesStart", dates.split(" - ")[0] ?? "");
  fd.append("datesEnd", dates.split(" - ")[1] ?? "");
  fd.append("status", status);
  fd.append("budgetMin", String(budgetMin));
  fd.append("budgetMax", String(budgetMax));
  fd.append("termPreference", termPreference);
  fd.append("petPolicy", petPolicy);
  fd.append("genderPreference", genderPreference);
  fd.append("occupants", String(occupants));
  fd.append("referencesRequired", String(referencesRequired));
  fd.append("lifestyleTags", JSON.stringify(lifestyleTags));

  const res = await fetch("/api/pipeline/process", { method: "POST", body: fd });

  setSubmitStage("done");
  if (res.ok) {
    router.push("/landlord/dashboard");
    router.refresh();
  } else {
    setIsSubmitting(false);
    setSubmitStage("idle");
  }
};
```

**Step 3: Replace the "Listing Image" JSX section with a video section**

Replace the entire `<div>` block for "Listing Image" with:

```tsx
<div>
  <label className="block text-sm font-medium text-muted mb-2">
    Property Video
  </label>
  <div className="space-y-3">
    {videoPreview && (
      <div className="relative w-full rounded-xl overflow-hidden border-2 border-warm-gray/20">
        <video
          src={videoPreview}
          controls
          className="w-full max-h-72 object-cover"
        />
        <button
          type="button"
          onClick={() => {
            setVideoPreview(null);
            setVideo(null);
            if (videoInputRef.current) videoInputRef.current.value = "";
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )}
    <input
      ref={videoInputRef}
      type="file"
      accept="video/*"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setVideo(file);
        setVideoPreview(URL.createObjectURL(file));
      }}
      className="w-full px-4 py-3 rounded-xl bg-warm-gray/5 border-2 border-warm-gray/20 text-foreground focus:outline-none focus:border-accent/40 transition-colors"
    />
  </div>
</div>
```

**Step 4: Update the submit button label to show pipeline stages**

```tsx
{isSubmitting ? (
  <span className="flex items-center gap-2">
    <motion.div
      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
    />
    {submitStage === "uploading" ? "Uploading video..." : "Creating listing..."}
  </span>
) : (
  "Create Listing"
)}
```

**Step 5: Verify TypeScript compiles and page renders**

```bash
cd frontend && npx tsc --noEmit
```

Then open http://localhost:3000/landlord/dashboard/new and confirm:
- Video file picker shows instead of image input
- Selecting a video shows a `<video>` preview with controls
- Remove button clears the preview

**Step 6: Commit**

```bash
git add frontend/src/app/landlord/dashboard/new/page.tsx
git commit -m "feat: replace image upload with video pipeline on new listing form"
```

---

### Task 5: Smoke test end-to-end

**Step 1: Ensure env vars are set in `.env.local`**

Check `frontend/.env.local` has:
```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
BACKBOARD_API_KEY=
CURATOR_ASSISTANT_ID=
REVIEWER_ASSISTANT_ID=
MONGODB_URI=
```

**Step 2: Start dev server**

```bash
cd frontend && npm run dev
```

**Step 3: Manual test**

1. Go to http://localhost:3000/landlord/dashboard/new
2. Fill in title, address, price, dates, requirements
3. Upload a short video file
4. Click "Create Listing"
5. Observe "Uploading video..." button state
6. Confirm redirect to `/landlord/dashboard` after API responds
7. Check MongoDB — listing should exist with `videoProcessing: true`, `images: []`
8. Wait ~2 minutes, recheck MongoDB — `images` should be populated with Cloudinary URLs, `videoProcessing: false`
