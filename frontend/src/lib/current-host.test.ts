import assert from "node:assert/strict";
import test from "node:test";

import {
  CurrentHostAuthError,
  resolveCurrentHost,
  type CurrentHostUserRecord,
} from "./current-host.ts";

function makeHost(overrides: Partial<CurrentHostUserRecord> = {}): CurrentHostUserRecord {
  return {
    _id: "507f1f77bcf86cd799439011",
    auth0Id: undefined,
    email: "host@example.com",
    role: "host",
    name: "Host Jordan",
    ...overrides,
  };
}

test("resolveCurrentHost rejects when there is no authenticated session", async () => {
  await assert.rejects(
    () =>
      resolveCurrentHost({
        session: null,
        findByAuth0Id: async () => null,
        findByEmail: async () => null,
        bindAuth0Id: async () => undefined,
      }),
    (error: unknown) => {
      assert.ok(error instanceof CurrentHostAuthError);
      assert.equal(error.status, 401);
      return true;
    }
  );
});

test("resolveCurrentHost binds auth0Id when a seeded host is found by email", async () => {
  const host = makeHost();
  const calls: Array<{ userId: string; auth0Id: string }> = [];

  const result = await resolveCurrentHost({
    session: {
      user: {
        sub: "auth0|host-123",
        email: "host@example.com",
      },
    },
    findByAuth0Id: async () => null,
    findByEmail: async (email) => {
      assert.equal(email, "host@example.com");
      return host;
    },
    bindAuth0Id: async (userId, auth0Id) => {
      calls.push({ userId, auth0Id });
    },
  });

  assert.deepEqual(result, {
    _id: host._id,
    email: host.email,
    auth0Id: "auth0|host-123",
    name: host.name,
  });
  assert.deepEqual(calls, [{ userId: host._id, auth0Id: "auth0|host-123" }]);
});

test("resolveCurrentHost rejects when the authenticated user is not a host", async () => {
  await assert.rejects(
    () =>
      resolveCurrentHost({
        session: {
          user: {
            sub: "auth0|tenant-123",
            email: "tenant@example.com",
          },
        },
        findByAuth0Id: async () => null,
        findByEmail: async () =>
          makeHost({
            role: "tenant",
            email: "tenant@example.com",
          }),
        bindAuth0Id: async () => undefined,
      }),
    (error: unknown) => {
      assert.ok(error instanceof CurrentHostAuthError);
      assert.equal(error.status, 403);
      return true;
    }
  );
});

test("resolveCurrentHost does not bind or reject demo sessions for the seeded host", async () => {
  const host = makeHost({
    auth0Id: "auth0|real-host-123",
    email: "jordan@landlord.com",
    name: "Jordan",
  });
  const calls: Array<{ userId: string; auth0Id: string }> = [];

  const result = await resolveCurrentHost({
    session: {
      user: {
        sub: "demo|jordan",
        email: "jordan@landlord.com",
      },
    },
    findByAuth0Id: async () => null,
    findByEmail: async (email) => {
      assert.equal(email, "jordan@landlord.com");
      return host;
    },
    bindAuth0Id: async (userId, auth0Id) => {
      calls.push({ userId, auth0Id });
    },
  });

  assert.deepEqual(result, {
    _id: host._id,
    email: host.email,
    auth0Id: "demo|jordan",
    name: host.name,
  });
  assert.deepEqual(calls, []);
});
