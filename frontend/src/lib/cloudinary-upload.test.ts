import assert from "node:assert/strict";
import test from "node:test";

import {
  CloudinaryUploadValidationError,
  extractPipelineVideoSource,
  createCloudinarySignedUploadPayload,
  buildCloudinarySignature,
  buildCloudinaryVideoUploadUrl,
  validateUploadedVideoPublicId,
} from "./cloudinary-upload.ts";

test("buildCloudinarySignature signs sorted params with the API secret", () => {
  assert.equal(
    buildCloudinarySignature(
      { timestamp: 1700000000, folder: "subletme/listings" },
      "secret"
    ),
    "1a887a2c7e5eb360218737b42348fa38a498285a"
  );
});

test("buildCloudinaryVideoUploadUrl returns the Cloudinary video upload endpoint", () => {
  assert.equal(
    buildCloudinaryVideoUploadUrl("demo-cloud"),
    "https://api.cloudinary.com/v1_1/demo-cloud/video/upload"
  );
});

test("buildCloudinaryVideoUploadUrl rejects blank cloud names", () => {
  assert.throws(
    () => buildCloudinaryVideoUploadUrl("   "),
    (error: unknown) => {
      assert.ok(error instanceof CloudinaryUploadValidationError);
      assert.equal(error.message, "Cloudinary cloud name is required");
      return true;
    }
  );
});

test("validateUploadedVideoPublicId trims and returns a public id", () => {
  assert.equal(
    validateUploadedVideoPublicId(" subletme/listings/demo-video "),
    "subletme/listings/demo-video"
  );
});

test("validateUploadedVideoPublicId rejects empty values", () => {
  assert.throws(
    () => validateUploadedVideoPublicId(""),
    (error: unknown) => {
      assert.ok(error instanceof CloudinaryUploadValidationError);
      assert.equal(error.message, "Property video is required");
      return true;
    }
  );
});

test("validateUploadedVideoPublicId rejects full URLs instead of public ids", () => {
  assert.throws(
    () =>
      validateUploadedVideoPublicId(
        "https://res.cloudinary.com/demo/video/upload/subletme/listings/demo-video.mp4"
      ),
    (error: unknown) => {
      assert.ok(error instanceof CloudinaryUploadValidationError);
      assert.equal(error.message, "Video upload reference is invalid");
      return true;
    }
  );
});

test("createCloudinarySignedUploadPayload returns the signed upload fields", () => {
  const payload = createCloudinarySignedUploadPayload({
    cloudName: "demo-cloud",
    apiKey: "key-123",
    apiSecret: "secret",
    timestamp: 1700000000,
    folder: "subletme/listings",
  });

  assert.deepEqual(payload, {
    cloudName: "demo-cloud",
    apiKey: "key-123",
    folder: "subletme/listings",
    timestamp: 1700000000,
    signature: "1a887a2c7e5eb360218737b42348fa38a498285a",
  });
});

test("createCloudinarySignedUploadPayload rejects missing credentials", () => {
  assert.throws(
    () =>
      createCloudinarySignedUploadPayload({
        cloudName: "demo-cloud",
        apiKey: "",
        apiSecret: "secret",
        timestamp: 1700000000,
        folder: "subletme/listings",
      }),
    (error: unknown) => {
      assert.ok(error instanceof CloudinaryUploadValidationError);
      assert.equal(error.message, "Cloudinary upload credentials are not configured");
      return true;
    }
  );
});

test("extractPipelineVideoSource prefers a cloudinary public id", () => {
  assert.deepEqual(
    extractPipelineVideoSource({
      videoPublicId: "subletme/listings/direct-uploaded-video",
      videoDataUrl: "data:video/mp4;base64,YWJj",
    }),
    {
      kind: "public_id",
      publicId: "subletme/listings/direct-uploaded-video",
    }
  );
});

test("extractPipelineVideoSource falls back to a data url when no public id exists", () => {
  assert.deepEqual(
    extractPipelineVideoSource({
      videoDataUrl: "data:video/mp4;base64,YWJj",
    }),
    {
      kind: "data_url",
      dataUrl: "data:video/mp4;base64,YWJj",
    }
  );
});

test("extractPipelineVideoSource rejects payloads without any video source", () => {
  assert.throws(
    () => extractPipelineVideoSource({}),
    (error: unknown) => {
      assert.ok(error instanceof CloudinaryUploadValidationError);
      assert.equal(error.message, "Property video is required");
      return true;
    }
  );
});
