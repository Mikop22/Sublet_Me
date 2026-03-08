import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

const PROTECTED_PATHS = ["/dashboard", "/create-profile", "/assistant"];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export async function middleware(request: NextRequest) {
  const response = await auth0.middleware(request);

  if (!isProtectedPath(request.nextUrl.pathname)) {
    return response;
  }

  const session = await auth0.getSession(request);
  if (session) {
    return response;
  }

  const loginUrl = new URL("/api/auth/login", request.url);
  loginUrl.searchParams.set("returnTo", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
