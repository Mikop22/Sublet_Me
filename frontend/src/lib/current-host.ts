export type CurrentHostUserRecord = {
  _id: string;
  auth0Id?: string;
  email: string;
  role: "tenant" | "host";
  name: string;
};

type SessionUser = {
  sub?: string;
  email?: string;
};

type SessionLike = {
  user?: SessionUser;
} | null;

type ResolveCurrentHostOptions = {
  session: SessionLike;
  findByAuth0Id: (auth0Id: string) => Promise<CurrentHostUserRecord | null>;
  findByEmail: (email: string) => Promise<CurrentHostUserRecord | null>;
  bindAuth0Id: (userId: string, auth0Id: string) => Promise<void>;
};

export class CurrentHostAuthError extends Error {
  status: 401 | 403;

  constructor(status: 401 | 403, message: string) {
    super(message);
    this.name = "CurrentHostAuthError";
    this.status = status;
  }
}

export async function resolveCurrentHost({
  session,
  findByAuth0Id,
  findByEmail,
  bindAuth0Id,
}: ResolveCurrentHostOptions): Promise<{
  _id: string;
  email: string;
  auth0Id?: string;
  name: string;
}> {
  const auth0Id = session?.user?.sub?.trim();
  const email = session?.user?.email?.trim().toLowerCase();
  const isDemoSession = auth0Id?.startsWith("demo|") ?? false;

  if (!auth0Id || !email) {
    throw new CurrentHostAuthError(401, "Authenticated host session required");
  }

  let user = await findByAuth0Id(auth0Id);
  if (!user) {
    user = await findByEmail(email);
  }

  if (!user) {
    throw new CurrentHostAuthError(403, "No host account found for this user");
  }

  if (user.role !== "host") {
    throw new CurrentHostAuthError(403, "Authenticated user is not a host");
  }

  if (!isDemoSession && user.auth0Id && user.auth0Id !== auth0Id) {
    throw new CurrentHostAuthError(403, "Host account is linked to a different login");
  }

  if (!isDemoSession && !user.auth0Id) {
    await bindAuth0Id(user._id, auth0Id);
  }

  return {
    _id: user._id,
    email: user.email,
    auth0Id,
    name: user.name,
  };
}

export async function requireCurrentHost(): Promise<{
  _id: string;
  email: string;
  auth0Id?: string;
  name: string;
}> {
  const [{ auth0 }, { connectDB }, { User }, { cookies }, demoAuth] = await Promise.all([
    import("@/lib/auth0"),
    import("@/lib/mongodb"),
    import("@/models/User"),
    import("next/headers"),
    import("@/lib/demo-auth"),
  ]);

  await connectDB();

  const auth0Session = await auth0.getSession();
  const cookieStore = await cookies();
  const mergedSession = demoAuth.resolveSessionWithDemoOverride({
    session: auth0Session,
    demoCookieValue: cookieStore.get(demoAuth.DEMO_LOGIN_COOKIE)?.value,
  });
  const demoUser = demoAuth.getDemoUserFromCookie(
    cookieStore.get(demoAuth.DEMO_LOGIN_COOKIE)?.value
  );

  return resolveCurrentHost({
    session: mergedSession ?? (demoUser ? demoAuth.toDemoSession(demoUser) : null),
    findByAuth0Id: async (auth0Id) => {
      const user = await User.findOne({ auth0Id })
        .select("_id auth0Id email role name")
        .lean<{
          _id: { toString(): string };
          auth0Id?: string;
          email: string;
          role: "tenant" | "host";
          name: string;
        } | null>()
        .exec();

      if (!user) {
        return null;
      }

      return {
        _id: user._id.toString(),
        auth0Id: user.auth0Id,
        email: user.email,
        role: user.role,
        name: user.name,
      };
    },
    findByEmail: async (email) => {
      const user = await User.findOne({ email })
        .select("_id auth0Id email role name")
        .lean<{
          _id: { toString(): string };
          auth0Id?: string;
          email: string;
          role: "tenant" | "host";
          name: string;
        } | null>()
        .exec();

      if (!user) {
        return null;
      }

      return {
        _id: user._id.toString(),
        auth0Id: user.auth0Id,
        email: user.email,
        role: user.role,
        name: user.name,
      };
    },
    bindAuth0Id: async (userId, auth0Id) => {
      await User.updateOne({ _id: userId }, { $set: { auth0Id } }).exec();
    },
  });
}
