import {
  formatRelativeTime,
  getRelativeTimeParts,
  getRelativeTimeRefreshMs,
} from "../../src/utils/relativeTime.js";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("getRelativeTimeParts", () => {
  test("stays in seconds just under the minute boundary", () => {
    expect(getRelativeTimeParts(59_999).unit).toBe("second");
    expect(getRelativeTimeParts(-59_999).unit).toBe("second");
  });

  test("crosses into minutes at 60 000 ms", () => {
    expect(getRelativeTimeParts(MINUTE).unit).toBe("minute");
    expect(getRelativeTimeParts(-MINUTE).unit).toBe("minute");
  });

  test("crosses into hours at 24 h", () => {
    expect(getRelativeTimeParts(DAY).unit).toBe("day");
    expect(getRelativeTimeParts(HOUR).unit).toBe("hour");
    expect(getRelativeTimeParts(-DAY).unit).toBe("day");
  });

  test("crosses into weeks at 7 d", () => {
    expect(getRelativeTimeParts(7 * DAY).unit).toBe("week");
    expect(getRelativeTimeParts(-7 * DAY).unit).toBe("week");
  });

  test("crosses into months at 30 d", () => {
    expect(getRelativeTimeParts(30 * DAY).unit).toBe("month");
    expect(getRelativeTimeParts(-30 * DAY).unit).toBe("month");
  });

  test("crosses into years at 365 d", () => {
    expect(getRelativeTimeParts(365 * DAY).unit).toBe("year");
    expect(getRelativeTimeParts(-365 * DAY).unit).toBe("year");
  });
});

describe("formatRelativeTime", () => {
  const now = 0;

  test("renders minutes in the past", () => {
    expect(formatRelativeTime(-5 * MINUTE, { now, locale: "en" })).toBe(
      "5 minutes ago",
    );
  });

  test("renders days in the future", () => {
    expect(formatRelativeTime(2 * DAY, { now, locale: "en" })).toBe(
      "in 2 days",
    );
  });

  test("renders yesterday with numeric auto", () => {
    expect(
      formatRelativeTime(-DAY, { now, locale: "en", numeric: "auto" }),
    ).toBe("yesterday");
  });

  test("renders the short style", () => {
    expect(
      formatRelativeTime(-5 * MINUTE, {
        now,
        locale: "en",
        style: "short",
      }),
    ).toBe("5 min. ago");
  });

  test("returns an empty string for invalid input", () => {
    expect(formatRelativeTime("not a date", { now, locale: "en" })).toBe("");
  });
});

describe("getRelativeTimeRefreshMs", () => {
  test("ticks every second under a minute", () => {
    expect(getRelativeTimeRefreshMs(30 * SECOND)).toBe(1000);
  });

  test("ticks every minute under an hour", () => {
    expect(getRelativeTimeRefreshMs(30 * MINUTE)).toBe(60_000);
  });

  test("ticks every hour otherwise", () => {
    expect(getRelativeTimeRefreshMs(2 * HOUR)).toBe(3_600_000);
  });
});
