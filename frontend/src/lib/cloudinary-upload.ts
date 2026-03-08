import { createHash } from "node:crypto";

export class CloudinaryUploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CloudinaryUploadValidationError";
  }
}

export function buildCloudinarySignature(
  params: Record<string, string | number>,
  apiSecret: string
): string {
  const serialized = Object.entries(params)
    .filter(([, value]) => value !== "" && value !== undefined && value !== null)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1")
    .update(`${serialized}${apiSecret}`)
    .digest("hex");
}

export function buildCloudinaryVideoUploadUrl(cloudName: string): string {
  const trimmedCloudName = cloudName.trim();
  if (!trimmedCloudName) {
    throw new CloudinaryUploadValidationError("Cloudinary cloud name is required");
  }

  return `https://api.cloudinary.com/v1_1/${trimmedCloudName}/video/upload`;
}

export function createCloudinarySignedUploadPayload({
  cloudName,
  apiKey,
  apiSecret,
  timestamp,
  folder,
}: {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  timestamp: number;
  folder: string;
}): {
  cloudName: string;
  apiKey: string;
  folder: string;
  timestamp: number;
  signature: string;
} {
  if (!cloudName.trim() || !apiKey.trim() || !apiSecret.trim()) {
    throw new CloudinaryUploadValidationError(
      "Cloudinary upload credentials are not configured"
    );
  }

  return {
    cloudName: cloudName.trim(),
    apiKey: apiKey.trim(),
    folder,
    timestamp,
    signature: buildCloudinarySignature({ folder, timestamp }, apiSecret.trim()),
  };
}

export function extractPipelineVideoSource(payload: {
  videoPublicId?: unknown;
  videoDataUrl?: unknown;
}):
  | {
      kind: "public_id";
      publicId: string;
    }
  | {
      kind: "data_url";
      dataUrl: string;
    } {
  if (typeof payload.videoPublicId === "string" && payload.videoPublicId.trim()) {
    return {
      kind: "public_id",
      publicId: validateUploadedVideoPublicId(payload.videoPublicId),
    };
  }

  if (typeof payload.videoDataUrl === "string" && payload.videoDataUrl.trim()) {
    return {
      kind: "data_url",
      dataUrl: payload.videoDataUrl,
    };
  }

  throw new CloudinaryUploadValidationError("Property video is required");
}

export function validateUploadedVideoPublicId(value: unknown): string {
  const publicId = typeof value === "string" ? value.trim() : "";

  if (!publicId) {
    throw new CloudinaryUploadValidationError("Property video is required");
  }

  if (publicId.includes("://")) {
    throw new CloudinaryUploadValidationError("Video upload reference is invalid");
  }

  return publicId;
}
