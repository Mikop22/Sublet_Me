/**
 * Video → Listing Pipeline (Multi-Agent)
 *
 * Two Backboard agents work together:
 *   1. Curator  — selects 5-6 best frames from extracted pool
 *   2. Reviewer — QA-checks the selection; can request a retry with more frames
 *
 * Loop: 10 frames → 20 → 40 (max 3 rounds). At the cap the Reviewer
 * picks the best selection across all rounds.
 *
 * Both agents use memory: "Auto" so they learn across runs.
 * Assistant IDs are persisted in .env.local for memory continuity.
 *
 * Usage: npx tsx scripts/test-pipeline.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { v2 as cloudinary } from "cloudinary";

// ── Config ───────────────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const BB_KEY = process.env.BACKBOARD_API_KEY!;
const BB_BASE = "https://app.backboard.io/api";
const bbHeaders = { "X-API-Key": BB_KEY, "Content-Type": "application/json" };

const VIDEO_PATH =
  "https://res.cloudinary.com/dkegkhxwi/video/upload/v1772928768/Fully_Furnished_Studio_Apartment_in_Downtown_Toronto_newly_renovated_-_Toronto_Furnished_Living_480p_h264_youtube_m704xu.mp4";
const INITIAL_FRAMES = 10;
const MAX_FRAMES = 40;
const MAX_ROUNDS = 3;

// ── Types ────────────────────────────────────────────────────────────────────
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

// ── Backboard helpers ────────────────────────────────────────────────────────
async function getOrCreateAssistant(
  envKey: string,
  name: string,
  systemPrompt: string
): Promise<string> {
  const existing = process.env[envKey];
  if (existing) {
    console.log(`   ♻️  Reusing ${name}: ${existing}`);
    return existing;
  }

  const res = await fetch(`${BB_BASE}/assistants`, {
    method: "POST",
    headers: bbHeaders,
    body: JSON.stringify({ name, system_prompt: systemPrompt }),
  });
  const data = await res.json();
  const id = data.assistant_id;
  console.log(`   🆕 Created ${name}: ${id}`);
  console.log(`   ⚠️  Add to .env.local: ${envKey}=${id}`);
  return id;
}

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
    body: new URLSearchParams({
      content,
      memory: "Auto",
      stream: "false",
    }),
  });
  const data = await res.json();
  return data.content;
}

// ── Step 1: Upload video ─────────────────────────────────────────────────────
async function uploadVideo(
  filePath: string
): Promise<{ publicId: string; duration: number }> {
  console.log("📤 Uploading video to Cloudinary...");

  const result = await cloudinary.uploader.upload(filePath, {
    resource_type: "video",
    folder: "subletme/listings",
    eager: [{ effect: "preview:duration_8" }],
    eager_async: true,
  });

  console.log(`   Public ID: ${result.public_id}`);
  console.log(`   Duration: ${result.duration}s`);
  console.log(`   Size: ${(result.bytes / 1024 / 1024).toFixed(1)}MB`);
  console.log(`   ⏳ AI highlight preview generating in background...`);

  return { publicId: result.public_id, duration: result.duration };
}

// ── Step 2: Extract frames + tag ─────────────────────────────────────────────
async function extractFrames(
  publicId: string,
  duration: number,
  numFrames: number
): Promise<FrameData[]> {
  console.log(
    `\n🖼️  Extracting ${numFrames} frames across ${duration}s video...`
  );

  const interval = duration / (numFrames + 1);
  const frames: FrameData[] = [];

  for (let i = 1; i <= numFrames; i++) {
    const timestamp = Math.round(interval * i);

    const imageUrl = cloudinary.url(publicId, {
      resource_type: "video",
      format: "jpg",
      transformation: [
        { start_offset: timestamp },
        { width: 1920, height: 1080, crop: "fill", gravity: "auto" },
        { effect: "upscale" },
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

    frames.push({ index: i, timestamp, imageUrl, thumbnailUrl, tags: [] });
    console.log(`   Frame ${i}: ${timestamp}s`);
  }

  // AI tagging via Cloudinary AI Content Analysis
  console.log("\n🏷️  Getting Cloudinary AI tags for each frame...");
  for (const frame of frames) {
    try {
      const tagResult = await cloudinary.uploader.upload(frame.thumbnailUrl, {
        resource_type: "image",
        folder: "subletme/temp-frames",
        detection: "coco",
        auto_tagging: 0.5,
      });
      frame.tags = tagResult.tags ?? [];
      console.log(
        `   Frame ${frame.index} (${frame.timestamp}s): [${frame.tags.join(", ")}]`
      );
      await cloudinary.uploader.destroy(tagResult.public_id);
    } catch (err: any) {
      const msg = err?.error?.message || err?.message || String(err);
      console.log(`   Frame ${frame.index}: tagging failed (${msg})`);
    }
  }

  return frames;
}

// ── Step 3: Highlight clip URL ───────────────────────────────────────────────
function getHighlightUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    resource_type: "video",
    format: "mp4",
    transformation: [
      { effect: "preview:duration_8" },
      { width: 1200, height: 675, crop: "fill", gravity: "auto" },
      { quality: "auto", fetch_format: "auto" },
    ],
  });
}

// ── Step 4: Curator agent ────────────────────────────────────────────────────
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

async function curateFrames(
  curatorId: string,
  frames: FrameData[],
  reviewerFeedback?: string
): Promise<CuratorResult> {
  const threadId = await createThread(curatorId);

  const frameDescriptions = frames
    .map(
      (f) =>
        `Frame ${f.index} (${f.timestamp}s): Tags: [${f.tags.length > 0 ? f.tags.join(", ") : "no tags detected"}] | URL: ${f.thumbnailUrl}`
    )
    .join("\n");

  let message = `Analyze these ${frames.length} frames extracted from a Toronto apartment tour video and select the best 5-6 for the listing gallery:\n\n${frameDescriptions}`;

  if (reviewerFeedback) {
    message += `\n\nIMPORTANT — A reviewer rejected your previous selection with this feedback:\n"${reviewerFeedback}"\nPlease address this feedback in your new selection.`;
  }

  const response = await sendMessage(threadId, message);
  console.log("\n📋 Curator response:");
  console.log(response);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        selected: parsed.selected ?? [],
        hero: parsed.hero ?? parsed.selected?.[0] ?? 0,
        labels: parsed.labels ?? {},
        reasoning: parsed.reasoning ?? "",
      };
    }
  } catch {
    console.log("   ⚠️  Could not parse JSON from curator response");
  }

  return { selected: [], hero: 0, labels: {}, reasoning: "Parse failed" };
}

// ── Step 5: Reviewer agent ───────────────────────────────────────────────────
const REVIEWER_PROMPT = `You are a quality assurance reviewer for a student sublet listing platform.

You review frame selections made by a Curator agent for apartment listing photo galleries.

EVALUATION CRITERIA:
1. ROOM DIVERSITY: Are at least 3 distinct room types represented? (kitchen, living room, bedroom, bathroom, balcony/view)
2. NO DUPLICATES: Are any two selected frames within 5 seconds of each other? That likely means duplicate rooms.
3. TAG COVERAGE: If most frames had tags but selected ones don't, that's suspicious — the curator may have ignored useful data.
4. HERO QUALITY: Is the hero frame from roughly 20-40% into the video? (Not the very start or end)
5. SPREAD: Are selections distributed across the video timeline, not clustered in one section?

SCORING:
- If 4-5 criteria pass: approve
- If 2-3 criteria fail: retry with specific feedback

Return ONLY valid JSON with keys: verdict ("approved" or "retry"), feedback (specific issues to fix, or "Looks good" if approved).`;

async function reviewSelection(
  reviewerId: string,
  frames: FrameData[],
  curatorResult: CuratorResult,
  videoDuration: number
): Promise<ReviewResult> {
  const threadId = await createThread(reviewerId);

  const selectedDetails = curatorResult.selected
    .map((idx) => {
      const f = frames.find((fr) => fr.index === idx);
      const label = curatorResult.labels[String(idx)] ?? "unknown";
      return f
        ? `Frame ${idx} (${f.timestamp}s) — "${label}" — Tags: [${f.tags.join(", ") || "none"}]`
        : `Frame ${idx} — not found`;
    })
    .join("\n");

  const taggedCount = frames.filter((f) => f.tags.length > 0).length;

  const message = `Review this gallery selection for a ${Math.round(videoDuration)}s Toronto apartment tour video.

TOTAL FRAMES AVAILABLE: ${frames.length}
FRAMES WITH TAGS: ${taggedCount}/${frames.length}
VIDEO DURATION: ${Math.round(videoDuration)}s

CURATOR'S SELECTION (${curatorResult.selected.length} frames):
${selectedDetails}

HERO IMAGE: Frame ${curatorResult.hero}
CURATOR'S REASONING: "${curatorResult.reasoning}"

Evaluate against the quality criteria and return your verdict.`;

  const response = await sendMessage(threadId, message);
  console.log("\n🔍 Reviewer response:");
  console.log(response);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        verdict: parsed.verdict === "approved" ? "approved" : "retry",
        feedback: parsed.feedback ?? "",
      };
    }
  } catch {
    console.log("   ⚠️  Could not parse reviewer response — treating as approved");
  }

  return { verdict: "approved", feedback: "Could not parse — auto-approved" };
}

// ── Step 6: Final pick (when cap reached) ────────────────────────────────────
async function pickBestRound(
  reviewerId: string,
  rounds: RoundResult[]
): Promise<number> {
  const threadId = await createThread(reviewerId);

  const roundSummaries = rounds
    .map((r) => {
      const labels = Object.entries(r.curatorResult.labels)
        .map(([idx, label]) => `  Frame ${idx}: ${label}`)
        .join("\n");
      const feedback = r.reviewResult?.feedback ?? "N/A";
      return `ROUND ${r.round} (${r.numFrames} frames extracted):
Selected: [${r.curatorResult.selected.join(", ")}]
Hero: Frame ${r.curatorResult.hero}
Labels:
${labels}
Curator reasoning: "${r.curatorResult.reasoning}"
Your prior feedback: "${feedback}"`;
    })
    .join("\n\n");

  const message = `You've reviewed ${rounds.length} rounds of gallery curation for the same apartment video. None fully met your criteria. Pick the BEST round overall.

${roundSummaries}

Return ONLY valid JSON with keys: best_round (number 1-${rounds.length}), reasoning (one sentence).`;

  const response = await sendMessage(threadId, message);
  console.log("\n🏆 Reviewer's final pick:");
  console.log(response);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.best_round ?? rounds.length;
    }
  } catch {}

  return rounds.length;
}

// ── Main Pipeline ────────────────────────────────────────────────────────────
async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log("  SUBLET-ME: Video → Listing Pipeline (Multi-Agent)");
  console.log("═══════════════════════════════════════════════════\n");

  // Create / reuse persistent assistants
  console.log("🤖 Setting up agents...");
  const curatorId = await getOrCreateAssistant(
    "CURATOR_ASSISTANT_ID",
    "Listing Photo Curator",
    CURATOR_PROMPT
  );
  const reviewerId = await getOrCreateAssistant(
    "REVIEWER_ASSISTANT_ID",
    "Gallery QA Reviewer",
    REVIEWER_PROMPT
  );

  // 1. Upload
  const { publicId, duration } = await uploadVideo(VIDEO_PATH);
  const highlightUrl = getHighlightUrl(publicId);

  // 2. Curator–Reviewer loop
  const rounds: RoundResult[] = [];
  let numFrames = INITIAL_FRAMES;
  let approved = false;
  let reviewerFeedback: string | undefined;

  for (let round = 1; round <= MAX_ROUNDS; round++) {
    console.log(`\n${"─".repeat(50)}`);
    console.log(`  ROUND ${round}/${MAX_ROUNDS} — ${numFrames} frames`);
    console.log(`${"─".repeat(50)}`);

    // Extract & tag
    const frames = await extractFrames(publicId, duration, numFrames);

    // Curate
    console.log("\n🤖 Curator selecting frames...");
    const curatorResult = await curateFrames(curatorId, frames, reviewerFeedback);

    if (curatorResult.selected.length === 0) {
      console.log("   ❌ Curator returned empty selection — retrying...");
      numFrames = Math.min(numFrames * 2, MAX_FRAMES);
      rounds.push({
        round,
        numFrames,
        frames,
        curatorResult,
        reviewResult: { verdict: "retry", feedback: "Empty selection" },
      });
      continue;
    }

    // Review
    console.log("\n🔍 Reviewer evaluating selection...");
    const reviewResult = await reviewSelection(
      reviewerId,
      frames,
      curatorResult,
      duration
    );

    rounds.push({ round, numFrames, frames, curatorResult, reviewResult });

    console.log(`\n   📊 Verdict: ${reviewResult.verdict.toUpperCase()}`);
    if (reviewResult.feedback) {
      console.log(`   💬 Feedback: ${reviewResult.feedback}`);
    }

    if (reviewResult.verdict === "approved") {
      approved = true;
      break;
    }

    // Prepare next round
    reviewerFeedback = reviewResult.feedback;
    numFrames = Math.min(numFrames * 2, MAX_FRAMES);
  }

  // 3. Determine final selection
  let finalRound: RoundResult;

  if (approved) {
    finalRound = rounds[rounds.length - 1];
    console.log(`\n✅ Approved in round ${finalRound.round}!`);
  } else {
    console.log(
      `\n⚠️  Cap reached after ${MAX_ROUNDS} rounds — Reviewer picking best...`
    );
    const bestRoundNum = await pickBestRound(reviewerId, rounds);
    finalRound = rounds[bestRoundNum - 1] ?? rounds[rounds.length - 1];
    console.log(`   Reviewer chose round ${finalRound.round} as best.`);
  }

  // 4. Output final gallery
  console.log("\n═══════════════════════════════════════════════════");
  console.log("  FINAL GALLERY");
  console.log("═══════════════════════════════════════════════════\n");

  const { curatorResult, frames } = finalRound;

  console.log(
    `Selected ${curatorResult.selected.length} frames (round ${finalRound.round}, ${finalRound.numFrames} candidates):`
  );
  for (const idx of curatorResult.selected) {
    const frame = frames.find((f) => f.index === idx);
    const label = curatorResult.labels[String(idx)] ?? "";
    if (frame) {
      console.log(
        `   📸 Frame ${idx} (${frame.timestamp}s) [${label}]: ${frame.imageUrl}`
      );
    }
  }

  console.log(`\n🏠 Hero image: Frame ${curatorResult.hero}`);
  console.log(`🎬 Highlight video: ${highlightUrl}`);
  console.log(`📦 Video publicId: ${publicId}`);
  console.log(
    `\nTo use in listing: store publicId="${publicId}" and images=[${curatorResult.selected.map((i) => `frame_${i}`).join(", ")}]`
  );
}

main().catch((err) => {
  console.error("\n❌ Pipeline failed:", err);
  process.exit(1);
});
