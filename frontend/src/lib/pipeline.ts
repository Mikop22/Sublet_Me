/**
 * Video Pipeline Library
 *
 * Exports runVideoPipeline(videoBuffer, listingId) which:
 *   1. Uploads a video buffer to Cloudinary
 *   2. Generates a highlight clip URL
 *   3. Runs the curator→reviewer loop (max 3 rounds: 10 → 20 → 40 frames)
 *   4. Extracts frame URLs via Cloudinary transformations
 *   5. Tags frames via temp Cloudinary uploads (detection:"coco", auto_tagging:0.5)
 *   6. Calls Backboard API for Curator and Reviewer agents
 *   7. Patches the listing in MongoDB with results
 */

import { v2 as cloudinary } from "cloudinary";
import { connectDB } from "@/lib/mongodb";
import { Listing } from "@/models/Listing";

// ── Cloudinary config ────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Backboard config ─────────────────────────────────────────────────────────
const BB_BASE = "https://app.backboard.io/api";

// ── Constants ────────────────────────────────────────────────────────────────
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
async function createThread(assistantId: string): Promise<string> {
  const res = await fetch(`${BB_BASE}/assistants/${assistantId}/threads`, {
    method: "POST",
    headers: {
      "X-API-Key": process.env.BACKBOARD_API_KEY!,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`createThread failed: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return data.thread_id;
}

async function sendMessage(threadId: string, content: string): Promise<string> {
  const res = await fetch(`${BB_BASE}/threads/${threadId}/messages`, {
    method: "POST",
    headers: { "X-API-Key": process.env.BACKBOARD_API_KEY! },
    body: new URLSearchParams({
      content,
      memory: "Auto",
      stream: "false",
    }),
  });
  if (!res.ok) throw new Error(`sendMessage failed: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return data.content;
}

// ── Step 1: Upload video buffer to Cloudinary ────────────────────────────────
async function uploadVideo(
  videoBuffer: Buffer
): Promise<{ publicId: string; duration: number }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "video",
        folder: "subletme/listings",
        eager: [{ effect: "preview:duration_8" }],
        eager_async: true,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload returned no result"));
          return;
        }
        resolve({ publicId: result.public_id, duration: result.duration ?? 0 });
      }
    );
    uploadStream.end(videoBuffer);
  });
}

// ── Step 2: Generate highlight URL ───────────────────────────────────────────
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

// ── Step 3: Extract frames + tag ─────────────────────────────────────────────
async function extractFrames(
  publicId: string,
  duration: number,
  numFrames: number
): Promise<FrameData[]> {
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
  }

  // AI tagging via temp Cloudinary uploads
  for (const frame of frames) {
    try {
      const tagResult = await cloudinary.uploader.upload(frame.thumbnailUrl, {
        resource_type: "image",
        folder: "subletme/temp-frames",
        detection: "coco",
        auto_tagging: 0.5,
      });
      frame.tags = tagResult.tags ?? [];
      await cloudinary.uploader.destroy(tagResult.public_id);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : String(err);
      console.error(`Frame ${frame.index}: tagging failed (${msg})`);
    }
  }

  return frames;
}

// ── Step 4: Curator agent ────────────────────────────────────────────────────
async function curateFrames(
  curatorId: string,
  frames: FrameData[],
  reviewerFeedback?: string
): Promise<CuratorResult> {
  const threadId = await createThread(curatorId);

  const frameDescriptions = frames
    .map(
      (f) =>
        `Frame ${f.index} (${f.timestamp}s): Tags: [${
          f.tags.length > 0 ? f.tags.join(", ") : "no tags detected"
        }] | URL: ${f.thumbnailUrl}`
    )
    .join("\n");

  let message = `Analyze these ${frames.length} frames extracted from a Toronto apartment tour video and select the best 5-6 for the listing gallery:\n\n${frameDescriptions}`;

  if (reviewerFeedback) {
    message += `\n\nIMPORTANT — A reviewer rejected your previous selection with this feedback:\n"${reviewerFeedback}"\nPlease address this feedback in your new selection.`;
  }

  const response = await sendMessage(threadId, message);

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
    console.error("Could not parse JSON from curator response");
  }

  return { selected: [], hero: 0, labels: {}, reasoning: "Parse failed" };
}

// ── Step 5: Reviewer agent ───────────────────────────────────────────────────
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
        ? `Frame ${idx} (${f.timestamp}s) — "${label}" — Tags: [${
            f.tags.join(", ") || "none"
          }]`
        : `Frame ${idx} — not found`;
    })
    .join("\n");

  const taggedCount = frames.filter((f) => f.tags.length > 0).length;

  const message = `Review this gallery selection for a ${Math.round(
    videoDuration
  )}s Toronto apartment tour video.

TOTAL FRAMES AVAILABLE: ${frames.length}
FRAMES WITH TAGS: ${taggedCount}/${frames.length}
VIDEO DURATION: ${Math.round(videoDuration)}s

CURATOR'S SELECTION (${curatorResult.selected.length} frames):
${selectedDetails}

HERO IMAGE: Frame ${curatorResult.hero}
CURATOR'S REASONING: "${curatorResult.reasoning}"

Evaluate against the quality criteria and return your verdict.`;

  const response = await sendMessage(threadId, message);

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
    console.error("Could not parse reviewer response — treating as approved");
  }

  return { verdict: "approved", feedback: "Could not parse — auto-approved" };
}

// ── Step 6: Final pick when cap reached ──────────────────────────────────────
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

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.best_round ?? rounds.length;
    }
  } catch {
    // fall through to default
  }

  return rounds.length;
}

// ── Main exported function ───────────────────────────────────────────────────
export async function runVideoPipeline(
  videoBuffer: Buffer,
  listingId: string
): Promise<void> {
  // Assistants pre-provisioned with prompts in Backboard dashboard
  const curatorId = process.env.CURATOR_ASSISTANT_ID!;
  const reviewerId = process.env.REVIEWER_ASSISTANT_ID!;

  try {
    // 0. Connect to DB early — fail fast if unavailable
    await connectDB();

    // 1. Upload video
    const { publicId, duration } = await uploadVideo(videoBuffer);

    // 2. Generate highlight URL
    const highlightUrl = getHighlightUrl(publicId);

    // 3. Curator–Reviewer loop
    const rounds: RoundResult[] = [];
    let numFrames = INITIAL_FRAMES;
    let approved = false;
    let reviewerFeedback: string | undefined;

    for (let round = 1; round <= MAX_ROUNDS; round++) {
      // Extract & tag frames
      const frames = await extractFrames(publicId, duration, numFrames);

      // Curate
      const curatorResult = await curateFrames(
        curatorId,
        frames,
        reviewerFeedback
      );

      if (curatorResult.selected.length === 0) {
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
      const reviewResult = await reviewSelection(
        reviewerId,
        frames,
        curatorResult,
        duration
      );

      rounds.push({ round, numFrames, frames, curatorResult, reviewResult });

      if (reviewResult.verdict === "approved") {
        approved = true;
        break;
      }

      reviewerFeedback = reviewResult.feedback;
      numFrames = Math.min(numFrames * 2, MAX_FRAMES);
    }

    // 4. Determine final selection
    let finalRound: RoundResult;

    if (approved) {
      finalRound = rounds[rounds.length - 1];
    } else {
      const bestRoundNum = await pickBestRound(reviewerId, rounds);
      finalRound = rounds[bestRoundNum - 1] ?? rounds[rounds.length - 1];
    }

    const { curatorResult, frames } = finalRound;

    // Build gallery image URLs from selected frame indices
    const images = curatorResult.selected
      .map((idx) => {
        const frame = frames.find((f) => f.index === idx);
        return frame?.imageUrl;
      })
      .filter((url): url is string => Boolean(url));

    // Put hero image first
    const heroFrame = frames.find((f) => f.index === curatorResult.hero);
    if (heroFrame) {
      const heroUrl = heroFrame.imageUrl;
      const heroIndex = images.indexOf(heroUrl);
      if (heroIndex > 0) {
        images.splice(heroIndex, 1);
        images.unshift(heroUrl);
      }
    }

    // 5. Patch listing in MongoDB
    await Listing.findByIdAndUpdate(listingId, {
      images,
      videoPublicId: publicId,
      highlightUrl,
      videoProcessing: false,
    });
  } catch (err: unknown) {
    console.error("runVideoPipeline error:", err);

    try {
      await connectDB();
      await Listing.findByIdAndUpdate(listingId, { videoProcessing: false });
    } catch (dbErr: unknown) {
      console.error("Failed to clear videoProcessing flag:", dbErr);
    }
  }
}
