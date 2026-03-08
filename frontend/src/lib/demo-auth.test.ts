import assert from "node:assert/strict";
import test from "node:test";

import {
  DEMO_LOGIN_COOKIE,
  getDemoUser,
  getDemoUserFromCookie,
  isDemoAuthEnabled,
  normalizeDemoReturnTo,
  resolveSessionWithDemoOverride,
  toDemoSession,
} from "./demo-auth.ts";

test("isDemoAuthEnabled disables the shortcut in production", () => {
  assert.equal(isDemoAuthEnabled("production"), false);
  assert.equal(isDemoAuthEnabled("development"), true);
});

test("getDemoUser returns the seeded Jordan host in development", () => {
  const user = getDemoUser("jordan", "development");

  assert.deepEqual(user, {
    alias: "jordan",
    name: "Jordan",
    email: "jordan@landlord.com",
    sub: "demo|jordan",
  });
});

test("getDemoUser rejects unknown aliases and production mode", () => {
  assert.equal(getDemoUser("unknown", "development"), null);
  assert.equal(getDemoUser("jordan", "production"), null);
});

test("getDemoUserFromCookie resolves the same seeded host as the route cookie", () => {
  const user = getDemoUserFromCookie("jordan", "development");

  assert.equal(DEMO_LOGIN_COOKIE, "subletme_demo_user");
  assert.equal(user?.email, "jordan@landlord.com");
  assert.equal(user?.sub, "demo|jordan");
});

test("toDemoSession converts a demo user into the same session shape current-host expects", () => {
  const demoUser = getDemoUser("jordan", "development");
  assert.ok(demoUser);

  assert.deepEqual(toDemoSession(demoUser), {
    user: {
      sub: "demo|jordan",
      email: "jordan@landlord.com",
      name: "Jordan",
    },
  });
});

test("normalizeDemoReturnTo only allows safe local paths", () => {
  assert.equal(normalizeDemoReturnTo("/landlord/dashboard/new"), "/landlord/dashboard/new");
  assert.equal(normalizeDemoReturnTo("//evil.example"), "/landlord/dashboard");
  assert.equal(normalizeDemoReturnTo("https://evil.example"), "/landlord/dashboard");
  assert.equal(normalizeDemoReturnTo(""), "/landlord/dashboard");
});

test("resolveSessionWithDemoOverride prefers the demo cookie over an existing auth session", () => {
  const session = resolveSessionWithDemoOverride({
    session: {
      user: {
        sub: "auth0|tenant-123",
        email: "tenant@example.com",
        name: "Tenant User",
      },
    },
    demoCookieValue: "jordan",
    nodeEnv: "development",
  });

  assert.deepEqual(session, {
    user: {
      sub: "demo|jordan",
      email: "jordan@landlord.com",
      name: "Jordan",
    },
  });
});
