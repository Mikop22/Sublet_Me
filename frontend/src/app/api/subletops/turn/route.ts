import { NextResponse } from "next/server";

import {
  getBffUserContext,
  getSubletOpsBackendUrl,
} from "@/lib/subletops-bff";

export async function GET(request: Request) {
  const user = await getBffUserContext();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("session_id");
    const historyUrl = new URL(`${getSubletOpsBackendUrl()}/v1/orchestrator/history`);
    historyUrl.searchParams.set("user_sub", user.sub);
    if (sessionId) {
      historyUrl.searchParams.set("session_id", sessionId);
    }

    const backendResponse = await fetch(historyUrl, { cache: "no-store" });
    const data = (await backendResponse.json()) as unknown;
    return NextResponse.json(data, { status: backendResponse.status });
  } catch {
    return NextResponse.json(
      { error: "SubletOps backend unavailable" },
      { status: 503 }
    );
  }
}

export async function POST(request: Request) {
  const user = await getBffUserContext();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const message = body.message;
  const session_id = body.session_id;
  const metadata = body.metadata;

  if (!message || typeof message !== "string") {
    return NextResponse.json(
      { error: "Missing message payload" },
      { status: 400 }
    );
  }

  try {
    const backendResponse = await fetch(
      `${getSubletOpsBackendUrl()}/v1/orchestrator/turn`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, message, session_id, metadata }),
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
