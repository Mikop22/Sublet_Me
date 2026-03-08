import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  DEMO_LOGIN_COOKIE,
  getDemoUser,
  normalizeDemoReturnTo,
} from "@/lib/demo-auth";

export async function GET(request: NextRequest) {
  const userAlias = request.nextUrl.searchParams.get("user");
  const demoUser = getDemoUser(userAlias);

  if (!demoUser) {
    return NextResponse.json({ error: "Demo login not available" }, { status: 404 });
  }

  const returnTo = normalizeDemoReturnTo(
    request.nextUrl.searchParams.get("returnTo")
  );

  const response = NextResponse.redirect(new URL(returnTo, request.url));
  response.cookies.set(DEMO_LOGIN_COOKIE, demoUser.alias, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}
