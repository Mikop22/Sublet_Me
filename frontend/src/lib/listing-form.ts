export class ListingFormValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ListingFormValidationError";
  }
}

function parseDate(value: string): Date | null {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export function parseListingAvailability({
  datesStart,
  datesEnd,
}: {
  datesStart: string;
  datesEnd: string;
}): {
  start: Date;
  end: Date;
} {
  if (!datesStart || !datesEnd) {
    throw new ListingFormValidationError(
      "Start and end availability dates are required"
    );
  }

  const start = parseDate(datesStart);
  const end = parseDate(datesEnd);

  if (!start || !end) {
    throw new ListingFormValidationError(
      "Availability dates must be valid calendar dates"
    );
  }

  if (end < start) {
    throw new ListingFormValidationError(
      "End date must be on or after the start date"
    );
  }

  return { start, end };
}
