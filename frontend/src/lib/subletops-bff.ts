import { auth0 } from "@/lib/auth0";

export type BffUserContext = {
  sub: string;
  email?: string;
  email_verified: boolean;
  verification_tier: "verified_email" | "authenticated";
};

export function getSubletOpsBackendUrl(): string {
  return process.env.SUBLETOPS_BACKEND_URL ?? "http://localhost:8000";
}

export async function getBffUserContext(): Promise<BffUserContext | null> {
  const session = await auth0.getSession();
  if (!session?.user?.sub) {
    return null;
  }

  const emailVerified = Boolean(session.user.email_verified);
  return {
    sub: session.user.sub,
    email: typeof session.user.email === "string" ? session.user.email : undefined,
    email_verified: emailVerified,
    verification_tier: emailVerified ? "verified_email" : "authenticated",
  };
}
