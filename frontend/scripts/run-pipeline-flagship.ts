/**
 * Run the video pipeline on Jordan's flagship listing using test.mp4
 *
 * Usage: npx tsx scripts/run-pipeline-flagship.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { Listing } from "../src/models/Listing";
import { User } from "../src/models/User";

// Need to reference User so Mongoose registers the model before populate
void User;

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI — create .env.local first");
  process.exit(1);
}

async function main() {
  await mongoose.connect(MONGODB_URI!);
  console.log("Connected to MongoDB");

  // Find Jordan's host record
  const jordan = await User.findOne({ email: "jordan@landlord.com" });
  if (!jordan) {
    console.error("Jordan host not found — run `npm run seed` first");
    process.exit(1);
  }
  console.log(`Found Jordan: ${jordan._id}`);

  // Find the flagship listing
  const flagship = await Listing.findOne({
    hostId: jordan._id,
    title: /Sunlit Studio/i,
  });
  if (!flagship) {
    console.error("Flagship listing not found — run `npm run seed` first");
    process.exit(1);
  }
  console.log(`Found flagship listing: ${flagship._id} — "${flagship.title}"`);

  // Mark as processing
  await Listing.findByIdAndUpdate(flagship._id, {
    videoProcessing: true,
    "enrichment.status": "processing",
  });
  console.log("Marked listing as videoProcessing=true");

  // Read the test video
  const videoPath = path.join(__dirname, "../public/test.mp4");
  if (!fs.existsSync(videoPath)) {
    console.error(`Video not found at ${videoPath}`);
    process.exit(1);
  }
  const videoBuffer = fs.readFileSync(videoPath);
  console.log(`Loaded test.mp4 (${(videoBuffer.length / 1024 / 1024).toFixed(1)} MB)`);

  // Import and run the pipeline
  // We need to dynamically import since it uses @/ path aliases
  // Instead, inline the key pipeline steps
  const { runVideoPipeline } = await import("../src/lib/pipeline");

  console.log("\nStarting video pipeline...\n");
  console.log("This will:");
  console.log("  1. Upload video to Cloudinary");
  console.log("  2. Generate highlight clip URL");
  console.log("  3. Extract frames and tag them");
  console.log("  4. Run Curator agent to select best frames");
  console.log("  5. Run Reviewer agent to validate selection");
  console.log("  6. Update listing with images + highlight URL");
  console.log("\nThis may take 2-5 minutes...\n");

  try {
    await runVideoPipeline(videoBuffer, flagship._id.toString());

    // Verify the result
    const updated = await Listing.findById(flagship._id);
    console.log("\n=== Pipeline Complete ===");
    console.log(`Images: ${updated?.images?.length ?? 0}`);
    console.log(`Highlight URL: ${updated?.highlightUrl ? "Yes" : "No"}`);
    console.log(`Video Public ID: ${updated?.videoPublicId ?? "None"}`);
    console.log(`Video Processing: ${updated?.videoProcessing}`);
    console.log(`Enrichment Status: ${updated?.enrichment?.status ?? "unknown"}`);

    if (updated?.images?.length) {
      console.log("\nGallery images:");
      for (const img of updated.images) {
        console.log(`  ${img}`);
      }
    }
  } catch (err) {
    console.error("\nPipeline failed:", err);
  }

  await mongoose.disconnect();
  console.log("\nDone.");
}

void main();
