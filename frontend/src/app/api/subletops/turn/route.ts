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
  const message = body.message;
  const session_id = body.session_id;
  const metadata = body.metadata;

  if (!message || typeof message !== "string") {
    return NextResponse.json(
      { error: "Missing message payload" },
      { status: 400 }
    );
  }

  const backendResponse = await fetch(
    `${getSubletOpsBackendUrl()}/v1/orchestrator/turn`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, message, session_id, metadata }),
      cache: "no-store",
    }
  );

  const data = (await backendResponse.json()) as unknown;
  return NextResponse.json(data, { status: backendResponse.status });
}
