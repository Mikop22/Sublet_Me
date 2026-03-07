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
  const profile = body.profile;
  if (!profile || typeof profile !== "object") {
    return NextResponse.json(
      { error: "Missing profile payload" },
      { status: 400 }
    );
  }

  const backendResponse = await fetch(
    `${getSubletOpsBackendUrl()}/v1/profiles/upsert`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, profile }),
      cache: "no-store",
    }
  );

  const data = (await backendResponse.json()) as unknown;
  return NextResponse.json(data, { status: backendResponse.status });
}
