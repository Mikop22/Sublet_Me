import assert from "node:assert/strict";
import test from "node:test";

import { ListingFormValidationError, parseListingAvailability } from "./listing-form.ts";

test("parseListingAvailability returns parsed start and end dates for valid ISO date input", () => {
  const availability = parseListingAvailability({
    datesStart: "2026-05-01",
    datesEnd: "2026-08-31",
  });

  assert.equal(availability.start.toISOString(), "2026-05-01T00:00:00.000Z");
  assert.equal(availability.end.toISOString(), "2026-08-31T00:00:00.000Z");
});

test("parseListingAvailability rejects missing dates with a user-facing message", () => {
  assert.throws(
    () =>
      parseListingAvailability({
        datesStart: "",
        datesEnd: "2026-08-31",
      }),
    (error: unknown) => {
      assert.ok(error instanceof ListingFormValidationError);
      assert.equal(error.message, "Start and end availability dates are required");
      return true;
    }
  );
});

test("parseListingAvailability rejects invalid dates", () => {
  assert.throws(
    () =>
      parseListingAvailability({
        datesStart: "not-a-date",
        datesEnd: "2026-08-31",
      }),
    (error: unknown) => {
      assert.ok(error instanceof ListingFormValidationError);
      assert.equal(error.message, "Availability dates must be valid calendar dates");
      return true;
    }
  );
});

test("parseListingAvailability rejects end dates before start dates", () => {
  assert.throws(
    () =>
      parseListingAvailability({
        datesStart: "2026-08-31",
        datesEnd: "2026-05-01",
      }),
    (error: unknown) => {
      assert.ok(error instanceof ListingFormValidationError);
      assert.equal(error.message, "End date must be on or after the start date");
      return true;
    }
  );
});
