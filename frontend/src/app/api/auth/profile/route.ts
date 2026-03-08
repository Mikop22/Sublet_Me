import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { auth0 } from "@/lib/auth0";
import {
  DEMO_LOGIN_COOKIE,
  getDemoUserFromCookie,
  resolveSessionWithDemoOverride,
} from "@/lib/demo-auth";

export async function GET() {
  const auth0Session = await auth0.getSession();
  const cookieStore = await cookies();
  const demoCookieValue = cookieStore.get(DEMO_LOGIN_COOKIE)?.value;
  const session = resolveSessionWithDemoOverride({
    session: auth0Session,
    demoCookieValue,
  });

  if (session?.user) {
    const demoUser = getDemoUserFromCookie(demoCookieValue);
    return NextResponse.json({
      ...session.user,
      ...(demoUser
        ? {
            nickname: demoUser.name.split(" ")[0],
            demo: true,
          }
        : null),
    });
  }

  if (!getDemoUserFromCookie(demoCookieValue)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
