export class VideoUploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VideoUploadValidationError";
  }
}

const DATA_URL_PREFIX_BYTES = 64;
export const DEMO_VIDEO_MAX_BYTES = 6 * 1024 * 1024;
export const DEMO_VIDEO_SIZE_LIMIT_MESSAGE =
  "Video exceeds 6 MB limit for local demo uploads";

export function estimateDataUrlJsonBytes(rawBytes: number): number {
  const base64Bytes = Math.ceil(rawBytes / 3) * 4;
  return DATA_URL_PREFIX_BYTES + base64Bytes;
}

export function parseVideoDataUrl({
  dataUrl,
  maxBytes,
}: {
  dataUrl: string;
  maxBytes: number;
}): {
  buffer: Buffer;
  mimeType: string;
  size: number;
} {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);

  if (!match) {
    throw new VideoUploadValidationError("Video upload payload is invalid");
  }

  const mimeType = match[1];
  if (!mimeType.startsWith("video/")) {
    throw new VideoUploadValidationError("File must be a video");
  }

  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length) {
    throw new VideoUploadValidationError("Video upload payload is invalid");
  }

  if (buffer.length > maxBytes) {
    throw new VideoUploadValidationError(DEMO_VIDEO_SIZE_LIMIT_MESSAGE);
  }

  return {
    buffer,
    mimeType,
    size: buffer.length,
  };
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new VideoUploadValidationError("Video upload payload is invalid"));
    };
    reader.onerror = () => {
      reject(new VideoUploadValidationError("Could not read video file"));
    };
    reader.readAsDataURL(file);
  });
}
