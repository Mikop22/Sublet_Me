import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import {
  CloudinaryUploadValidationError,
  extractPipelineVideoSource,
} from "@/lib/cloudinary-upload";
import { ListingFormValidationError, parseListingAvailability } from "@/lib/listing-form";
import { Listing } from "@/models/Listing";
import { runVideoPipeline, runVideoPipelineFromPublicId } from "@/lib/pipeline";
import { CurrentHostAuthError, requireCurrentHost } from "@/lib/current-host";
import {
  DEMO_VIDEO_MAX_BYTES,
  DEMO_VIDEO_SIZE_LIMIT_MESSAGE,
  VideoUploadValidationError,
  parseVideoDataUrl,
} from "@/lib/video-upload";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const host = await requireCurrentHost();
    const contentType = req.headers.get("content-type") ?? "";
    const requestPayload = contentType.includes("application/json")
      ? await parseJsonRequest(req)
      : await parseMultipartRequest(req);

    const title = requestPayload.title;
    const address = requestPayload.address;
    const city = requestPayload.city;
    const price = requestPayload.price;
    const datesStart = requestPayload.datesStart;
    const datesEnd = requestPayload.datesEnd;
    const status = requestPayload.status;
    const budgetMin = requestPayload.budgetMin;
    const budgetMax = requestPayload.budgetMax;
    const termPreference = requestPayload.termPreference;
    const petPolicy = requestPayload.petPolicy;
    const genderPreference = requestPayload.genderPreference;
    const occupants = requestPayload.occupants;
    const referencesRequired = requestPayload.referencesRequired;
    const rules = requestPayload.rules;
    const lifestyleTagsRaw = requestPayload.lifestyleTagsRaw;
    let lifestyleTags: string[] = [];
    if (lifestyleTagsRaw) {
      try {
        lifestyleTags = JSON.parse(lifestyleTagsRaw);
      } catch {
        return Response.json({ error: "Invalid lifestyleTags format" }, { status: 400 });
      }
    }

    if (!title.trim() || !address.trim()) {
      return Response.json(
        { error: "Title and address are required" },
        { status: 400 }
      );
    }
    if (!Number.isFinite(price) || price <= 0) {
      return Response.json(
        { error: "Monthly price must be greater than zero" },
        { status: 400 }
      );
    }

    const availability = parseListingAvailability({
      datesStart,
      datesEnd,
    });

    await connectDB();

    const listing = await Listing.create({
      hostId: new mongoose.Types.ObjectId(host._id),
      title,
      address,
      city,
      price,
      dates: {
        start: availability.start,
        end: availability.end,
      },
      status,
      rules,
      images: [],
      videoPublicId:
        requestPayload.videoSource.kind === "public_id"
          ? requestPayload.videoSource.publicId
          : "",
      videoProcessing: true,
      requirements: {
        budgetMin: budgetMin || Math.max(0, price - 100),
        budgetMax: budgetMax || price + 100,
        termPreference,
        petPolicy,
        genderPreference,
        occupants,
        referencesRequired,
        lifestyleTags,
      },
    });

    const listingId = listing._id.toString();

    if (requestPayload.videoSource.kind === "public_id") {
      runVideoPipelineFromPublicId(
        requestPayload.videoSource.publicId,
        listingId
      ).catch((err) => console.error("[pipeline] unhandled:", err));
    } else {
      runVideoPipeline(requestPayload.videoSource.videoBuffer, listingId).catch((err) =>
        console.error("[pipeline] unhandled:", err)
      );
    }

    return Response.json({ listingId });
  } catch (err) {
    if (err instanceof ListingFormValidationError) {
      return Response.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof VideoUploadValidationError) {
      return Response.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof CloudinaryUploadValidationError) {
      return Response.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof CurrentHostAuthError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    return Response.json({ error: String(err) }, { status: 500 });
  }
}

async function parseJsonRequest(req: Request): Promise<{
  videoSource:
    | {
        kind: "public_id";
        publicId: string;
      }
    | {
        kind: "buffer";
        videoBuffer: Buffer;
      };
  title: string;
  address: string;
  city: string;
  price: number;
  datesStart: string;
  datesEnd: string;
  status: string;
  budgetMin: number;
  budgetMax: number;
  termPreference: string;
  petPolicy: string;
  genderPreference: string;
  occupants: number;
  rules: string[];
  referencesRequired: boolean;
  lifestyleTagsRaw: string | null;
}> {
  const body = (await req.json()) as {
    videoPublicId?: unknown;
    videoDataUrl?: unknown;
    title?: unknown;
    address?: unknown;
    city?: unknown;
    price?: unknown;
    datesStart?: unknown;
    datesEnd?: unknown;
    status?: unknown;
    budgetMin?: unknown;
    budgetMax?: unknown;
    termPreference?: unknown;
    petPolicy?: unknown;
    genderPreference?: unknown;
    occupants?: unknown;
    referencesRequired?: unknown;
    lifestyleTags?: unknown;
    rules?: unknown;
  };

  const videoSource = extractPipelineVideoSource({
    videoPublicId: body.videoPublicId,
    videoDataUrl: body.videoDataUrl,
  });

  return {
    videoSource:
      videoSource.kind === "public_id"
        ? videoSource
        : {
            kind: "buffer",
            videoBuffer: parseVideoDataUrl({
              dataUrl: videoSource.dataUrl,
              maxBytes: DEMO_VIDEO_MAX_BYTES,
            }).buffer,
          },
    title: typeof body.title === "string" ? body.title : "",
    address: typeof body.address === "string" ? body.address : "",
    city: typeof body.city === "string" && body.city ? body.city : "Toronto",
    price: Number(body.price),
    datesStart: typeof body.datesStart === "string" ? body.datesStart : "",
    datesEnd: typeof body.datesEnd === "string" ? body.datesEnd : "",
    status: typeof body.status === "string" ? body.status : "active",
    budgetMin: Number(body.budgetMin),
    budgetMax: Number(body.budgetMax),
    termPreference:
      typeof body.termPreference === "string" ? body.termPreference : "",
    petPolicy: typeof body.petPolicy === "string" ? body.petPolicy : "no-pets",
    genderPreference:
      typeof body.genderPreference === "string"
        ? body.genderPreference
        : "no-preference",
    occupants: Number(body.occupants ?? 1),
    referencesRequired: Boolean(body.referencesRequired),
    rules: Array.isArray(body.rules) ? body.rules.filter((r): r is string => typeof r === "string") : [],
    lifestyleTagsRaw:
      typeof body.lifestyleTags === "string"
        ? body.lifestyleTags
        : body.lifestyleTags
          ? JSON.stringify(body.lifestyleTags)
          : null,
  };
}

async function parseMultipartRequest(req: Request): Promise<{
  videoSource:
    | {
        kind: "public_id";
        publicId: string;
      }
    | {
        kind: "buffer";
        videoBuffer: Buffer;
      };
  title: string;
  address: string;
  city: string;
  price: number;
  datesStart: string;
  datesEnd: string;
  status: string;
  budgetMin: number;
  budgetMax: number;
  termPreference: string;
  petPolicy: string;
  genderPreference: string;
  occupants: number;
  rules: string[];
  referencesRequired: boolean;
  lifestyleTagsRaw: string | null;
}> {
  let formData: FormData;

  try {
    formData = await req.formData();
  } catch {
    throw new VideoUploadValidationError(
      "Video upload could not be processed. Refresh and try again with a smaller MP4."
    );
  }

  const video = formData.get("video");
  if (!video || !(video instanceof File)) {
    throw new VideoUploadValidationError("Property video is required");
  }
  if (video.size > DEMO_VIDEO_MAX_BYTES) {
    throw new VideoUploadValidationError(DEMO_VIDEO_SIZE_LIMIT_MESSAGE);
  }
  if (!video.type.startsWith("video/")) {
    throw new VideoUploadValidationError("File must be a video");
  }

  return {
    videoSource: {
      kind: "buffer",
      videoBuffer: Buffer.from(await video.arrayBuffer()),
    },
    title: (formData.get("title") as string) ?? "",
    address: (formData.get("address") as string) ?? "",
    city: (formData.get("city") as string) ?? "Toronto",
    price: Number(formData.get("price")),
    datesStart: (formData.get("datesStart") as string) ?? "",
    datesEnd: (formData.get("datesEnd") as string) ?? "",
    status: (formData.get("status") as string) ?? "active",
    budgetMin: Number(formData.get("budgetMin")),
    budgetMax: Number(formData.get("budgetMax")),
    termPreference: (formData.get("termPreference") as string) ?? "",
    petPolicy: (formData.get("petPolicy") as string) ?? "no-pets",
    genderPreference:
      (formData.get("genderPreference") as string) ?? "no-preference",
    occupants: Number(formData.get("occupants") ?? 1),
    referencesRequired:
      (formData.get("referencesRequired") as string) === "true",
    rules: (() => {
      const raw = formData.get("rules") as string | null;
      if (!raw) return [];
      try { return JSON.parse(raw); } catch { return []; }
    })(),
    lifestyleTagsRaw: formData.get("lifestyleTags") as string | null,
  };
}
