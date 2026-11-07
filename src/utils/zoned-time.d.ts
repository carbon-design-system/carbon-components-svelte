/** Epoch milliseconds, or a `Date`. */
export type Instant = number | Date;

/** The wall clock in a zone. */
export type ZonedParts = {
  year: number;
  /** 1 to 12. */
  month: number;
  /** 1 to 31. */
  day: number;
  /** 0 to 23. */
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
  /** 0 (Sunday) to 6. `Temporal`'s `dayOfWeek` is `weekday || 7`. */
  weekday: number;
};

export type ZonedPartsInput = Pick<ZonedParts, "year" | "month" | "day"> &
  Partial<ZonedParts>;

/**
 * How `fromZoned` reads a wall time that happens twice (clocks go back) or
 * never (clocks go forward).
 */
export type Disambiguation = "compatible" | "earlier" | "later" | "reject";

export type ZonedUnit =
  "second" | "minute" | "hour" | "day" | "week" | "month" | "year";

export type ZonedDuration = {
  years?: number;
  months?: number;
  weeks?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  milliseconds?: number;
};

/** Whether `timeZone` is a name the engine knows. */
export function isTimeZone(timeZone: unknown): timeZone is string;

/**
 * The host's time zone, or `"UTC"` where the engine will not say. The one
 * function here that reads the environment: call it in the browser after
 * mount, or pass the result in from the caller.
 */
export function hostTimeZone(): string;

/**
 * One spelling per zone, the same in every engine, for comparing a saved
 * zone with a zone from a list (`Asia/Calcutta` and `Asia/Kolkata` both give
 * `Asia/Kolkata`). Returns `undefined` for a name the engine does not know.
 */
export function normalizeTimeZone(timeZone: string): string | undefined;

/**
 * The zones the engine knows, one spelling each, with `UTC` first and then
 * the rest sorted. `extra` adds names, such as a saved zone.
 */
export function listTimeZones(extra?: string[]): string[];

/** The wall clock in `timeZone` at `instant`. */
export function zonedParts(instant: Instant, timeZone: string): ZonedParts;

/**
 * How far `timeZone` is ahead of UTC at `instant`, in milliseconds (negative
 * west of Greenwich).
 */
export function offsetOf(instant: Instant, timeZone: string): number;

/** `"UTC"`, `"UTC−5"` or `"UTC+5:45"`, from an offset in milliseconds. */
export function formatUtcOffset(offset: number): string;

/**
 * The instant at which the wall clock in `timeZone` reads `parts`. Missing
 * time fields are 0, and fields out of range roll over as `Date.UTC` does.
 *
 * Throws a `RangeError` for fields that are not numbers, a zone the engine
 * does not know, or `"reject"` and a wall time that is repeated or skipped.
 */
export function fromZoned(
  parts: ZonedPartsInput,
  timeZone: string,
  options?: { disambiguation?: Disambiguation },
): number;

/** The calendar day at `instant` in `timeZone`, as `YYYY-MM-DD`. */
export function dayKey(instant: Instant, timeZone: string): string;

/**
 * The number of calendar days from the day of `from` to the day of `to` in
 * `timeZone`. Negative when `to` is earlier.
 */
export function diffCalendarDays(
  from: Instant,
  to: Instant,
  timeZone: string,
): number;

/**
 * First day of the week for a locale, 0 (Sunday) to 6, from `Intl.Locale`
 * where the engine has it and else from the DatePicker's table.
 */
export function resolveWeekStart(locale?: string): number;

/**
 * The first instant of the unit that holds `instant`, in `timeZone`.
 * `weekStart` is 0 (Sunday) to 6, default 1 (Monday).
 */
export function startOf(
  unit: ZonedUnit,
  instant: Instant,
  timeZone: string,
  options?: { weekStart?: number },
): number;

/** The last millisecond of the unit that holds `instant`. */
export function endOf(
  unit: ZonedUnit,
  instant: Instant,
  timeZone: string,
  options?: { weekStart?: number },
): number;

/**
 * `Temporal.ZonedDateTime.add`: calendar units keep the wall clock time,
 * elapsed units (hours and below) add time that passes. Throws a
 * `RangeError` for a duration with a fraction.
 */
export function addZoned(
  instant: Instant,
  duration: ZonedDuration,
  timeZone: string,
): number;
