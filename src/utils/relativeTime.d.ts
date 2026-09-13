/**
 * Relative time unit selection and adaptive refresh cadence.
 */

export type RelativeTimeUnit =
  | "second"
  | "minute"
  | "hour"
  | "day"
  | "week"
  | "month"
  | "year";

/** Convert a `Date`, epoch number, or date string to epoch milliseconds. */
export function toTimestamp(input: Date | number | string): number;

/** Select the `Intl.RelativeTimeFormat` unit and value for a time difference. */
export function getRelativeTimeParts(diffMs: number): {
  value: number;
  unit: RelativeTimeUnit;
};

/** Format `target` relative to `now`; `""` when `target` is invalid. */
export function formatRelativeTime(
  target: Date | number | string,
  options?: {
    now?: number;
    locale?: string;
    numeric?: "always" | "auto";
    style?: "long" | "short" | "narrow";
  },
): string;

/** Adaptive refresh interval: only fire when the displayed unit can change. */
export function getRelativeTimeRefreshMs(diffMs: number): number;
