# Cloudinary Direct Upload Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current landlord listing video transport with a signed direct-to-Cloudinary browser upload so `/api/pipeline/process` receives a `videoPublicId` instead of raw video bytes.

**Architecture:** Add a small authenticated signing route in the Next.js app, upload the selected video directly from the browser to Cloudinary, then submit the listing form with the returned `public_id`. Keep the existing async pipeline logic, but refactor it so it can process an already-uploaded Cloudinary video asset without re-uploading the file.

**Tech Stack:** Next.js 16 App Router, TypeScript, React 19, Cloudinary SDK, Mongoose/MongoDB, existing landlord dashboard flow

---

### Task 1: Add Cloudinary signing and uploaded-video validation helpers

**Files:**
- Create: `frontend/src/lib/cloudinary-upload.ts`
- Test: `frontend/src/lib/cloudinary-upload.test.ts`

**Step 1: Write the failing test for signing and public-id validation**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCloudinarySignature,
  buildCloudinaryVideoUploadUrl,
  validateUploadedVideoPublicId,
} from "./cloudinary-upload.ts";

test("buildCloudinarySignature signs sorted params with the API secret", () => {
  assert.equal(
    buildCloudinarySignature(
      { folder: "subletme/listings", timestamp: 1700000000 },
      "secret"
    ),
    "b1a57a40f4f4d5f30f6f6d35a6f6fb9f55e3b7c5"
  );
});

test("validateUploadedVideoPublicId trims and returns a public id", () => {
  assert.equal(validateUploadedVideoPublicId(" subletme/listings/demo-video "), "subletme/listings/demo-video");
});
```

**Step 2: Run the test to verify it fails**

Run: `cd /Users/user/Desktop/Frontend/frontend && node --test --experimental-strip-types src/lib/cloudinary-upload.test.ts`
Expected: FAIL because the helper file does not exist yet.

**Step 3: Write the minimal helper implementation**

```ts
import { createHash } from "node:crypto";

export function buildCloudinarySignature(
  params: Record<string, string | number>,
  apiSecret: string
): string {
  const serialized = Object.entries(params)
    .filter(([, value]) => value !== "" && value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1").update(`${serialized}${apiSecret}`).digest("hex");
}
```

Also export:

- `buildCloudinaryVideoUploadUrl(cloudName: string): string`
- `validateUploadedVideoPublicId(value: unknown): string`

**Step 4: Run the test to verify it passes**

Run: `cd /Users/user/Desktop/Frontend/frontend && node --test --experimental-strip-types src/lib/cloudinary-upload.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/lib/cloudinary-upload.ts frontend/src/lib/cloudinary-upload.test.ts
git commit -m "feat: add cloudinary direct upload helpers"
```

---

### Task 2: Add an authenticated Cloudinary signing route

**Files:**
- Create: `frontend/src/app/api/uploads/cloudinary-sign/route.ts`
- Modify: `frontend/src/lib/current-host.ts`
- Test: `frontend/src/lib/current-host.test.ts`

**Step 1: Write the failing auth-aware signing route test as a pure helper assertion**

Extend `frontend/src/lib/current-host.test.ts` with a case that confirms host auth errors still flow through when a protected route tries to resolve the current host.

**Step 2: Run the test to verify it fails for the new route behavior**

Run: `cd /Users/user/Desktop/Frontend/frontend && node --test --experimental-strip-types src/lib/current-host.test.ts`
Expected: FAIL once the new assertion is added.

**Step 3: Implement the signing route**

Create `frontend/src/app/api/uploads/cloudinary-sign/route.ts` that:

- requires a current host via `requireCurrentHost()`
- reads Cloudinary env vars
- uses `buildCloudinarySignature(...)`
- returns:

```ts
return Response.json({
  cloudName,
  apiKey,
  folder: "subletme/listings",
  timestamp,
  signature,
});
```

**Step 4: Run the test to verify it passes**

Run: `cd /Users/user/Desktop/Frontend/frontend && node --test --experimental-strip-types src/lib/current-host.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/app/api/uploads/cloudinary-sign/route.ts frontend/src/lib/current-host.test.ts
git commit -m "feat: add protected cloudinary signing route"
```

---

### Task 3: Accept `videoPublicId` in listing creation and keep legacy fallback paths intact

**Files:**
- Modify: `frontend/src/app/api/pipeline/process/route.ts`
- Test: `frontend/src/lib/cloudinary-upload.test.ts`
- Test: `frontend/src/lib/video-upload.test.ts`

**Step 1: Write the failing test for uploaded-video public-id validation**

Add tests that prove the route helper rejects empty or invalid `videoPublicId` inputs and still supports the existing data-url fallback.

**Step 2: Run the tests to verify they fail**

Run: `cd /Users/user/Desktop/Frontend/frontend && node --test --experimental-strip-types src/lib/cloudinary-upload.test.ts src/lib/video-upload.test.ts`
Expected: FAIL because the new validation path does not exist yet.

**Step 3: Implement the minimal route changes**

Update `frontend/src/app/api/pipeline/process/route.ts` so JSON requests prefer:

```ts
if (typeof body.videoPublicId === "string") {
  return {
    videoSource: {
      kind: "public_id",
      publicId: validateUploadedVideoPublicId(body.videoPublicId),
    },
    ...otherFields,
  };
}
```

Keep the old `videoDataUrl` / multipart parsing only as compatibility fallback.

When creating the listing, set:

```ts
videoPublicId: videoSource.kind === "public_id" ? videoSource.publicId : "",
videoProcessing: true,
```

Then dispatch either:

```ts
runVideoPipelineFromPublicId(videoSource.publicId, listingId)
```

or the legacy:

```ts
runVideoPipeline(videoBuffer, listingId)
```

**Step 4: Run the tests to verify they pass**

Run: `cd /Users/user/Desktop/Frontend/frontend && node --test --experimental-strip-types src/lib/cloudinary-upload.test.ts src/lib/video-upload.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/app/api/pipeline/process/route.ts frontend/src/lib/cloudinary-upload.test.ts frontend/src/lib/video-upload.test.ts
git commit -m "feat: accept uploaded cloudinary video references"
```

---

### Task 4: Refactor the pipeline to process already-uploaded Cloudinary videos

**Files:**
- Modify: `frontend/src/lib/pipeline.ts`
- Modify: `frontend/src/models/Listing.ts`
- Test: `frontend/src/lib/cloudinary-upload.test.ts`

**Step 1: Write the failing test for the pipeline input split**

Add a test around a small pure helper that decides whether a pipeline run should upload a buffer or fetch Cloudinary metadata for an existing `publicId`.

**Step 2: Run the test to verify it fails**

Run: `cd /Users/user/Desktop/Frontend/frontend && node --test --experimental-strip-types src/lib/cloudinary-upload.test.ts`
Expected: FAIL because the helper does not exist yet.

**Step 3: Implement the refactor**

Refactor `frontend/src/lib/pipeline.ts` into:

- `runVideoPipeline(videoBuffer, listingId)` for legacy flow
- `runVideoPipelineFromPublicId(publicId, listingId)` for direct upload
- shared internal processing after the upload step

Minimal structure:

```ts
async function getUploadedVideo(publicId: string): Promise<{ publicId: string; duration: number }> {
  const resource = await cloudinary.api.resource(publicId, { resource_type: "video" });
  return { publicId, duration: resource.duration ?? 30 };
}
```

Then both entry points feed the same frame extraction / curator / reviewer / DB patch path.

**Step 4: Run the test to verify it passes**

Run: `cd /Users/user/Desktop/Frontend/frontend && node --test --experimental-strip-types src/lib/cloudinary-upload.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/lib/pipeline.ts frontend/src/models/Listing.ts frontend/src/lib/cloudinary-upload.test.ts
git commit -m "refactor: support cloudinary direct-upload pipeline entry"
```

---

### Task 5: Switch the landlord new-listing page to direct Cloudinary upload

**Files:**
- Modify: `frontend/src/app/landlord/dashboard/new/page.tsx`
- Modify: `frontend/src/lib/cloudinary-upload.ts`
- Test: `frontend/src/lib/cloudinary-upload.test.ts`

**Step 1: Write the failing test for upload URL construction and public-id handling**

Add tests that prove the frontend helper builds the correct Cloudinary video upload URL and rejects blank cloud names.

**Step 2: Run the test to verify it fails**

Run: `cd /Users/user/Desktop/Frontend/frontend && node --test --experimental-strip-types src/lib/cloudinary-upload.test.ts`
Expected: FAIL for the new helper behavior.

**Step 3: Implement the browser upload flow**

Update `frontend/src/app/landlord/dashboard/new/page.tsx` so submit does this in order:

1. validate form fields
2. `fetch("/api/uploads/cloudinary-sign")`
3. `POST` the selected file directly to `https://api.cloudinary.com/v1_1/<cloudName>/video/upload`
4. read `public_id` from Cloudinary
5. `POST` listing fields + `videoPublicId` to `/api/pipeline/process`

Use a separate submit stage for upload vs listing creation so the UI can say what is happening.

**Step 4: Run the test to verify it passes**

Run: `cd /Users/user/Desktop/Frontend/frontend && node --test --experimental-strip-types src/lib/cloudinary-upload.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/app/landlord/dashboard/new/page.tsx frontend/src/lib/cloudinary-upload.ts frontend/src/lib/cloudinary-upload.test.ts
git commit -m "feat: upload listing videos directly to cloudinary"
```

---

### Task 6: Verify the full change set

**Files:**
- Modify: `docs/demo-runbook.md`

**Step 1: Update the runbook for the new upload flow**

Document that the browser uploads directly to Cloudinary before listing creation and that the old 6 MB JSON workaround is no longer the primary path.

**Step 2: Run targeted automated verification**

Run:

```bash
cd /Users/user/Desktop/Frontend/frontend && node --test --experimental-strip-types src/lib/cloudinary-upload.test.ts src/lib/video-upload.test.ts src/lib/listing-form.test.ts src/lib/current-host.test.ts
cd /Users/user/Desktop/Frontend/frontend && npx tsc --noEmit
cd /Users/user/Desktop/Frontend/frontend && npx eslint src/lib/cloudinary-upload.ts src/lib/cloudinary-upload.test.ts src/app/api/uploads/cloudinary-sign/route.ts src/app/api/pipeline/process/route.ts src/app/landlord/dashboard/new/page.tsx src/lib/pipeline.ts
```

**Step 3: Run manual verification**

1. `npm run dev`
2. open `/demo-login?user=jordan`
3. create a listing with a video over the old 6 MB ceiling
4. confirm the upload completes without JSON parser errors
5. confirm the listing appears and shows processing state

**Step 4: Commit**

```bash
git add docs/demo-runbook.md
git commit -m "docs: update demo runbook for direct cloudinary upload"
```
