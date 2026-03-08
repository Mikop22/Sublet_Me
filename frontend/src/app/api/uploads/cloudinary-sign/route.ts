import { NextResponse } from "next/server";

import { createCloudinarySignedUploadPayload } from "@/lib/cloudinary-upload";
import { CurrentHostAuthError, requireCurrentHost } from "@/lib/current-host";

export const runtime = "nodejs";

const CLOUDINARY_UPLOAD_FOLDER = "subletme/listings";

export async function POST() {
  try {
    await requireCurrentHost();

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
    const apiKey = process.env.CLOUDINARY_API_KEY ?? "";
    const apiSecret = process.env.CLOUDINARY_API_SECRET ?? "";
    const timestamp = Math.floor(Date.now() / 1000);

    return NextResponse.json(
      createCloudinarySignedUploadPayload({
        cloudName,
        apiKey,
        apiSecret,
        timestamp,
        folder: CLOUDINARY_UPLOAD_FOLDER,
      })
    );
  } catch (error) {
    if (error instanceof CurrentHostAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
