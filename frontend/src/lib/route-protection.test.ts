import assert from "node:assert/strict";
import test from "node:test";

import { isProtectedPath } from "./route-protection.ts";

test("isProtectedPath keeps existing protected paths and adds landlord routes", () => {
  assert.equal(isProtectedPath("/dashboard"), true);
  assert.equal(isProtectedPath("/create-profile"), true);
  assert.equal(isProtectedPath("/assistant"), true);
  assert.equal(isProtectedPath("/landlord/dashboard"), true);
  assert.equal(isProtectedPath("/landlord/dashboard/new"), true);
  assert.equal(isProtectedPath("/landlord/notifications"), true);
  assert.equal(isProtectedPath("/"), false);
  assert.equal(isProtectedPath("/login"), false);
});
