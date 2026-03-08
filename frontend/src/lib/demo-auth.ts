export const DEMO_LOGIN_COOKIE = "subletme_demo_user";

export type DemoUser = {
  alias: string;
  name: string;
  email: string;
  sub: string;
};

type SessionLike = {
  user?: {
    sub?: string;
    email?: string;
    name?: string;
  };
} | null;

const DEMO_USERS: Record<string, DemoUser> = {
  jordan: {
    alias: "jordan",
    name: "Jordan",
    email: "jordan@landlord.com",
    sub: "demo|jordan",
  },
};

export function isDemoAuthEnabled(
  nodeEnv: string | undefined = process.env.NODE_ENV
): boolean {
  return nodeEnv !== "production";
}

export function getDemoUser(
  alias: string | null | undefined,
  nodeEnv: string | undefined = process.env.NODE_ENV
): DemoUser | null {
  if (!isDemoAuthEnabled(nodeEnv) || !alias) {
    return null;
  }

  return DEMO_USERS[alias] ?? null;
}

export function getDemoUserFromCookie(
  cookieValue: string | null | undefined,
  nodeEnv: string | undefined = process.env.NODE_ENV
): DemoUser | null {
  return getDemoUser(cookieValue, nodeEnv);
}

export function normalizeDemoReturnTo(returnTo: string | null | undefined): string {
  if (!returnTo || !returnTo.startsWith("/") || returnTo.startsWith("//")) {
    return "/landlord/dashboard";
  }

  return returnTo;
}

export function resolveSessionWithDemoOverride({
  session,
  demoCookieValue,
  nodeEnv = process.env.NODE_ENV,
}: {
  session: SessionLike;
  demoCookieValue: string | null | undefined;
  nodeEnv?: string | undefined;
}): SessionLike {
  const demoUser = getDemoUserFromCookie(demoCookieValue, nodeEnv);
  return demoUser ? toDemoSession(demoUser) : session;
}

export function toDemoSession(demoUser: DemoUser): {
  user: {
    sub: string;
    email: string;
    name: string;
  };
} {
  return {
    user: {
      sub: demoUser.sub,
      email: demoUser.email,
      name: demoUser.name,
    },
  };
}
