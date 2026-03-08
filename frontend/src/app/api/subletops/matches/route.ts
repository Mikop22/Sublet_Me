import { NextResponse } from "next/server";

import {
  getBffUserContext,
  getSubletOpsBackendUrl,
} from "@/lib/subletops-bff";

export async function POST(request: Request) {
  const user = await getBffUserContext();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const limit = typeof body.limit === "number" ? body.limit : 8;

  try {
    const backendResponse = await fetch(
      `${getSubletOpsBackendUrl()}/v1/matches/query`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, limit }),
        cache: "no-store",
      }
    );

    const rawBody = await backendResponse.text();
    const contentType = backendResponse.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const payload = isJson
      ? (JSON.parse(rawBody || "{}") as unknown)
      : ({
          error: "SubletOps backend returned non-JSON response",
          details: rawBody.slice(0, 300),
        } as const);

    return NextResponse.json(payload, { status: backendResponse.status });
  } catch {
    return NextResponse.json(
      { error: "SubletOps backend unavailable" },
      { status: 503 }
    );
  }
}
