import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { DEMO_LOGIN_COOKIE, getDemoUserFromCookie } from "@/lib/demo-auth";
import { isProtectedPath } from "@/lib/route-protection";

export async function middleware(request: NextRequest) {
  const response = await auth0.middleware(request);

  if (!isProtectedPath(request.nextUrl.pathname)) {
    return response;
  }

  const session = await auth0.getSession(request);
  if (session) {
    return response;
  }

  const demoUser = getDemoUserFromCookie(
    request.cookies.get(DEMO_LOGIN_COOKIE)?.value
  );
  if (demoUser) {
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
