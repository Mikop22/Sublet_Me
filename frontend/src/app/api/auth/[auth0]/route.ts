import { NextRequest, NextResponse } from "next/server";

const SUPPORTED_AUTH_ROUTES = new Set([
  "login",
  "logout",
  "callback",
  "profile",
  "access-token",
  "backchannel-logout",
]);

function getAuthRoute(request: NextRequest): string | null {
  const segments = request.nextUrl.pathname.split("/").filter(Boolean);
  const route = segments[segments.length - 1];

  return SUPPORTED_AUTH_ROUTES.has(route) ? route : null;
}

function redirectToSdkRoute(request: NextRequest): NextResponse {
  const authRoute = getAuthRoute(request);
  if (!authRoute) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const targetUrl = new URL(`/auth/${authRoute}`, request.url);
  targetUrl.search = request.nextUrl.search;
  return NextResponse.redirect(targetUrl, 307);
}

export async function GET(request: NextRequest) {
  return redirectToSdkRoute(request);
}

export async function POST(request: NextRequest) {
  return redirectToSdkRoute(request);
}
