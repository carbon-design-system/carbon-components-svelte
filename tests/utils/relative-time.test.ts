// @vitest-environment node
import {
  formatRelativeTime,
  getRelativeTimeRefreshMs,
} from "../../src/utils/relative-time.js";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("formatRelativeTime", () => {
  const now = 0;

  it.each([
    [59_999, "in 60 seconds"],
    [MINUTE, "in 1 minute"],
    [HOUR, "in 1 hour"],
    [DAY, "in 1 day"],
    [7 * DAY, "in 1 week"],
    [30 * DAY, "in 1 month"],
    [365 * DAY, "in 1 year"],
    [-365 * DAY, "1 year ago"],
  ])("formats %d ms as %s", (diff, expected) => {
    expect(
      formatRelativeTime(diff, { now, locale: "en", numeric: "always" }),
    ).toBe(expected);
  });

  it("renders minutes in the past", () => {
    expect(formatRelativeTime(-5 * MINUTE, { now, locale: "en" })).toBe(
      "5 minutes ago",
    );
  });

  it("renders yesterday with numeric auto", () => {
    expect(
      formatRelativeTime(-DAY, { now, locale: "en", numeric: "auto" }),
    ).toBe("yesterday");
  });

  it("renders the short style", () => {
    expect(
      formatRelativeTime(-5 * MINUTE, {
        now,
        locale: "en",
        style: "short",
      }),
    ).toBe("5 min. ago");
  });

  it("returns an empty string for invalid input", () => {
    expect(formatRelativeTime("not a date", { now, locale: "en" })).toBe("");
  });
});

describe("getRelativeTimeRefreshMs", () => {
  it("ticks every second under a minute", () => {
    expect(getRelativeTimeRefreshMs(30 * SECOND)).toBe(1000);
  });

  it("ticks every minute under an hour", () => {
    expect(getRelativeTimeRefreshMs(30 * MINUTE)).toBe(60_000);
  });

  it("ticks every hour otherwise", () => {
    expect(getRelativeTimeRefreshMs(2 * HOUR)).toBe(3_600_000);
  });
});
