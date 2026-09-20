/**
 * Calendar-aware time ticks: values land on real boundaries (midnight, the
 * first of the month) instead of fixed millisecond multiples.
 */

export type TimeInterval =
  | "second"
  | "minute"
  | "hour"
  | "day"
  | "week"
  | "month"
  | "year";

export type TimeTickOptions = {
  /** Align to UTC boundaries instead of local time. @default false */
  utc?: boolean;
  /** First day of the week: `0` Sunday, `1` Monday. @default 0 */
  weekStart?: 0 | 1;
};

export type TimeTicks = {
  interval: TimeInterval;
  /** Number of `interval` units between ticks. */
  step: number;
  /** Tick positions as epoch milliseconds, ascending. */
  values: number[];
};

/**
 * About `count` tick values across `[start, end]` on calendar boundaries,
 * in local time unless `utc` is set. Bounds may be given in either order.
 */
export function timeTicks(
  start: Date | number,
  end: Date | number,
  count?: number,
  options?: TimeTickOptions,
): TimeTicks;

/**
 * Widen `[start, end]` outward to the calendar boundaries its ticks use.
 * Bounds must be ascending.
 */
export function niceTimeDomain(
  start: number,
  end: number,
  count?: number,
  options?: TimeTickOptions,
): [number, number];

/**
 * Tick label formatter matched to `interval`, backed by the shared
 * `Intl.DateTimeFormat` cache.
 */
export function timeTickFormat(
  interval: TimeInterval,
  locale?: string,
  options?: { utc?: boolean },
): (ms: number) => string;
