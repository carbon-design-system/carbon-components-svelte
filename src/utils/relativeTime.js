// @ts-check
// Relative time unit selection and adaptive refresh cadence.

/** @typedef {"second" | "minute" | "hour" | "day" | "week" | "month" | "year"} RelativeTimeUnit */

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30.4375 * DAY;
const YEAR = 365.25 * DAY;

/**
 * Convert a `Date`, epoch number, or date string to epoch milliseconds.
 *
 * @param {Date | number | string} input
 * @returns {number}
 */
export function toTimestamp(input) {
  if (input instanceof Date) return input.getTime();
  if (typeof input === "number") return input;
  if (typeof input === "string") return Date.parse(input);
  return Number.NaN;
}

/**
 * Select the `Intl.RelativeTimeFormat` unit and value for a time difference.
 *
 * @param {number} diffMs - `target - now`; negative for the past.
 * @returns {{ value: number; unit: RelativeTimeUnit }}
 */
export function getRelativeTimeParts(diffMs) {
  const abs = Math.abs(diffMs);

  if (abs < MINUTE)
    return { value: Math.round(diffMs / SECOND), unit: "second" };
  if (abs < HOUR) return { value: Math.round(diffMs / MINUTE), unit: "minute" };
  if (abs < DAY) return { value: Math.round(diffMs / HOUR), unit: "hour" };
  if (abs < WEEK) return { value: Math.round(diffMs / DAY), unit: "day" };
  if (abs < 30 * DAY) return { value: Math.round(diffMs / WEEK), unit: "week" };
  if (abs < 365 * DAY)
    return { value: Math.round(diffMs / MONTH), unit: "month" };
  return { value: Math.round(diffMs / YEAR), unit: "year" };
}

/**
 * Format `target` relative to `now` using `Intl.RelativeTimeFormat`.
 *
 * @param {Date | number | string} target
 * @param {{ now?: number, locale?: string, numeric?: "always" | "auto", style?: "long" | "short" | "narrow" }} [options]
 * @returns {string} `""` when `target` is invalid.
 */
export function formatRelativeTime(target, options = {}) {
  const {
    now = Date.now(),
    locale,
    numeric = "auto",
    style = "long",
  } = options;
  const timestamp = toTimestamp(target);
  if (Number.isNaN(timestamp)) return "";

  const { value, unit } = getRelativeTimeParts(timestamp - now);
  return new Intl.RelativeTimeFormat(locale, { numeric, style }).format(
    value,
    unit,
  );
}

/**
 * Adaptive refresh interval: only fire when the displayed unit can change.
 *
 * @param {number} diffMs
 * @returns {number}
 */
export function getRelativeTimeRefreshMs(diffMs) {
  const abs = Math.abs(diffMs);

  if (abs < MINUTE) return 1000;
  if (abs < HOUR) return 60_000;
  return 3_600_000;
}
