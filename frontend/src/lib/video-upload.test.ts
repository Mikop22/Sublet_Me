import assert from "node:assert/strict";
import test from "node:test";

import {
  DEMO_VIDEO_MAX_BYTES,
  VideoUploadValidationError,
  estimateDataUrlJsonBytes,
  parseVideoDataUrl,
} from "./video-upload.ts";

test("parseVideoDataUrl decodes a base64 video payload", () => {
  const parsed = parseVideoDataUrl({
    dataUrl: "data:video/mp4;base64,YWJj",
    maxBytes: 10,
  });

  assert.equal(parsed.mimeType, "video/mp4");
  assert.equal(parsed.buffer.toString("utf8"), "abc");
  assert.equal(parsed.size, 3);
});

test("parseVideoDataUrl rejects non-video mime types", () => {
  assert.throws(
    () =>
      parseVideoDataUrl({
        dataUrl: "data:text/plain;base64,YWJj",
        maxBytes: 10,
      }),
    (error: unknown) => {
      assert.ok(error instanceof VideoUploadValidationError);
      assert.equal(error.message, "File must be a video");
      return true;
    }
  );
});

test("parseVideoDataUrl rejects oversized payloads", () => {
  assert.throws(
    () =>
      parseVideoDataUrl({
        dataUrl: "data:video/mp4;base64,YWJj",
        maxBytes: 2,
      }),
    (error: unknown) => {
      assert.ok(error instanceof VideoUploadValidationError);
      assert.equal(error.message, "Video exceeds 6 MB limit for local demo uploads");
      return true;
    }
  );
});

test("parseVideoDataUrl rejects malformed data urls", () => {
  assert.throws(
    () =>
      parseVideoDataUrl({
        dataUrl: "not-a-data-url",
        maxBytes: 10,
      }),
    (error: unknown) => {
      assert.ok(error instanceof VideoUploadValidationError);
      assert.equal(error.message, "Video upload payload is invalid");
      return true;
    }
  );
});

test("local demo upload limit stays below the JSON parser ceiling after base64 expansion", () => {
  assert.ok(estimateDataUrlJsonBytes(DEMO_VIDEO_MAX_BYTES) < 10 * 1024 * 1024);
});
