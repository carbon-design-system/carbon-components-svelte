/**
 * What is wrong with a range. `"too-long"` and `"too-short"` are about its
 * length, `"before-min"` and `"after-max"` about its bounds.
 */
export type TimeRangeProblem =
  | "invalid-from"
  | "invalid-to"
  | "order"
  | "before-min"
  | "after-max"
  | "too-long"
  | "too-short";
export type ValidateOptions = ResolveOptions & {
  min?: Date | number | string;
  max?: Date | number | string;
  maxRange?: string | number;
  minRange?: string | number;
};
export type StepOptions = ResolveOptions & {
  max?: Date | number | string;
};
export type TimeRangeParamNames = {
  /** Default `"from"`. */
  from?: string | undefined;
  /** Default `"to"`. */
  to?: string | undefined;
  /** Default `"tz"`. */
  timeZone?: string | undefined;
};
/**
 * What a range is, for a label:
 *
 * - `rolling`: `now-N<unit>` to `now`, the last `amount` of `unit`
 * - `calendar`: a whole day, week, month or year, `offset` units from this one
 * - `since`: the start of this `unit` to `now` (`now/d` to `now`)
 * - `custom`: anything else
 */
export type TimeRangeKind =
  | {
      kind: "rolling";
      amount: number;
      unit: TimeUnit;
    }
  | {
      kind: "calendar";
      offset: number;
      unit: "d" | "w" | "M" | "y";
    }
  | {
      kind: "since";
      unit: "d" | "w" | "M" | "y";
    }
  | {
      kind: "custom";
    };
export type FormatOptions = ResolveOptions & {
  locale?: string;
  hourCycle?: "h12" | "h23";
  seconds?: boolean;
};
/**
 * One end of a range: an absolute instant (`"2026-11-06T14:00:00.000Z"`) or a
 * relative expression (`"now-15m"`, `"now/d"`), as Grafana and Elasticsearch
 * write them.
 */
export type TimeBound = string;
export type TimeRangeValue = {
  from: TimeBound;
  to: TimeBound;
};
export type ResolvedRange = {
  start: Date;
  /**
   * The last instant of the range. A bound rounded up
   * (`now/d` as `to`) ends one millisecond before the next unit starts.
   */
  end: Date;
};
export type TimeUnit = "s" | "m" | "h" | "d" | "w" | "M" | "y";
export type ResolveOptions = {
  /** The instant `now` stands for. Default: the current time. */
  now?: string | number | Date | undefined;
  /** IANA name. Default `"UTC"`. */
  timeZone?: string | undefined;
  /** First day of the week, 0 (Sunday) to 6. Default: the locale's, else Monday. */
  weekStart?: number | undefined;
  /** Picks `weekStart` when that is unset. */
  locale?: string | undefined;
};
export type ParsedAdd = {
  n: number;
  unit: TimeUnit;
};
export type ParsedRound = {
  unit: TimeUnit;
};
export type ParsedOp =
  | ({
      type: "add";
    } & ParsedAdd)
  | ({
      type: "round";
    } & ParsedRound);
/**
 * A parsed bound. `anchor` is `"now"` or an epoch time. A bound with no
 * `offset` (a date such as `2026-11-06`) reads in the time zone, and `dateOnly`
 * makes `to` mean the end of that day.
 */
export type ParsedBound = {
  kind: "now" | "instant" | "wall";
  /** `instant`: epoch milliseconds. */
  epoch?: number | undefined;
  /** `wall`: a date and time with no offset, read in the zone. */
  wall?: WallTime | undefined;
  dateOnly?: boolean | undefined;
  ops: ParsedOp[];
};
export type WallTime = {
  year: number;
  /** 1 to 12. */
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  ms: number;
};
/**
 * The quick ranges a trigger offers by default. `rolling` ranges end at
 * `now`; `calendar` ranges are whole days, weeks and months in the time zone.
 */
export type TimeRangePreset = {
  id: string;
  text: string;
  from: TimeBound;
  to: TimeBound;
  group?: string | undefined;
};

/** Whether `timeZone` is an IANA name the runtime knows. */
export function isTimeZone(timeZone: string): boolean;
/** The wall clock in `timeZone` at the instant `time`. */
export function wallTime(time: number, timeZone: string): WallTime;
/** The offset from UTC in minutes (negative west of Greenwich). */
export function timeZoneOffset(date: Date | number, timeZone: string): number;
/**
 * `"UTC"`, `"UTC−5"` or `"UTC+5:30"`. The minus is U+2212, so it never reads
 * as a hyphen.
 */
export function formatUtcOffset(minutes: number): string;
/**
 * The instant at which the wall clock in `timeZone` reads `wall`. A time that
 * happens twice (clocks go back) is the first one. A time that never happens
 * (clocks go forward) is read with the offset from before the change, so it
 * lands on the same wall time as the gap's end: 02:30 becomes 03:30.
 */
export function instantFromWall(wall: WallTime, timeZone: string): number;
/**
 * First day of the week for a locale, 0 (Sunday) to 6. Reads `Intl.Locale`
 * where the engine has it and falls back to the table the DatePicker uses.
 */
export function resolveWeekStart(locale?: string): number;
/**
 * Reads a bound: `now`, `now-15m`, `now-1d/d`, `now+1h`, an ISO date or date
 * and time (`2026-11-06`, `2026-11-06T09:00`, `2026-11-06 09:00:00-05:00`) or
 * epoch milliseconds. A date and time with no offset reads in the time zone
 * the range is resolved in. Returns `null` for anything else.
 *
 * Whitespace is ignored. A `+` that a URL decoded to a space still counts:
 * `now 1h` is `now+1h`.
 */
export function parseTimeBound(text: string): ParsedBound | null;
/**
 * A bound in its plain form: a relative one without spaces (`now - 1d / d`
 * and `now 1h` become `now-1d/d` and `now+1h`), any other trimmed. Text that
 * does not read comes back trimmed.
 */
export function normalizeTimeBound(text: string): string;
/** Whether `text` reads as a bound. */
export function isTimeBound(text: string): boolean;
/**
 * Reads a whole range typed in one box:
 *
 * | Text | Range |
 * | --- | --- |
 * | `last 90 minutes`, `past 2 hrs` | rolling, `now-90m` to `now` |
 * | `today`, `yesterday` | the calendar day |
 * | `this week`, `last month` | the calendar week or month; `last <unit>` with no number is the previous one |
 * | `now-2h to now`, `now-2h..now`, `now-2h - now` | as written |
 * | `2026-11-06 09:00 to 2026-11-06 12:30` | as written |
 *
 * Returns `null` when the text is not a range.
 */
export function parseTimeRangeText(text: string): TimeRangeValue | null;
/**
 * The instants a range covers. Each end is read at the same `now`.
 *
 * | Bound | Reads as |
 * | --- | --- |
 * | `now` | `options.now` |
 * | `now-15m` | 15 elapsed minutes back |
 * | `now-1d` | the same wall-clock time one calendar day back, in the zone |
 * | `now/d` | the start of the day in the zone; as `to`, its last millisecond |
 * | `2026-11-06T09:00` | 09:00 in the zone; with an offset or `Z`, that instant |
 *
 * An end that does not parse is an Invalid Date.
 */
export function resolveRange(
  value: TimeRangeValue,
  options?: ResolveOptions,
): ResolvedRange;
/**
 * A length in milliseconds, for `"90m"`, `"7d"` or `"2w"` (`d` is 24 hours
 * and `w` is 7 days here). Months and years have no fixed length: NaN.
 */
export function parseDuration(duration: string | number): number;
/**
 * Checks a range: both ends read, the end is after the start, and the range
 * stays inside `min`, `max` and the length limits. `min` and `max` can be
 * bounds themselves (`max: "now"`, `min: "now-30d"` for a retention window).
 */
export function validateRange(
  value: TimeRangeValue,
  options?: ValidateOptions,
):
  | {
      valid: true;
    }
  | {
      valid: false;
      problem: TimeRangeProblem;
    };
/**
 *   max?: Date | number | string,
 * }} StepOptions
 */
/**
 * The range one length earlier (`direction` -1) or later (1), as absolute
 * instants. A range of whole days, months or years moves by that many
 * calendar units, so "Today" steps to "Yesterday" across a clock change. Any
 * other moves by its exact length, so the new range ends where the old one
 * began.
 *
 * `max` (a `Date`, or a bound such as `"now"`) stops it going past: a step
 * that would end later is moved back so it ends at `max`, and `null` comes
 * back when the range already does.
 */
export function stepRange(
  value: TimeRangeValue,
  direction: -1 | 1,
  options?: StepOptions,
): TimeRangeValue | null;
/**
 * Widens a range around its middle by `factor` (2 doubles it; below 1 zooms
 * in). The result is absolute, except for the commonest case: `now-15m` to
 * `now` zooms to `now-30m` to `now`, so a shared link keeps following the
 * clock. `max` works as in `stepRange`.
 */
export function zoomRange(
  value: TimeRangeValue,
  factor?: number,
  options?: StepOptions,
): TimeRangeValue | null;
/**
 * The string form of a range for a URL or a form field: `now-15m..now`, or
 * `2026-11-06T14:00:00.000Z..2026-11-06T17:30:00.000Z`. `..` appears in no
 * bound.
 */
export function serializeTimeRange(value: TimeRangeValue): string;
/**
 * Reads what `serializeTimeRange` wrote. Also reads `from/to` written the
 * long way, and `now-15m to now`. Returns `null` for text that is not a
 * range, so a hand-edited URL never throws.
 */
export function parseTimeRange(
  text: string | null | undefined,
): TimeRangeValue | null;
/**
 * Writes a range as `from`, `to` and (when given) `tz` query parameters, the
 * shape Grafana's URLs have. `+` is encoded, so `now+1h` survives.
 */
export function timeRangeToSearchParams(
  value: TimeRangeValue,
  options?: {
    timeZone?: string;
    params?: URLSearchParams;
    names?: TimeRangeParamNames;
  },
): URLSearchParams;
/**
 * Reads what `timeRangeToSearchParams` wrote. Returns `null` when a bound is
 * missing or does not read; an unknown `tz` is left out rather than failing.
 */
export function timeRangeFromSearchParams(
  params: URLSearchParams | string,
  options?: {
    names?: TimeRangeParamNames;
  },
): {
  value: TimeRangeValue;
  timeZone?: string;
} | null;
/**
 * What a range is, for a label:
 *
 * - `rolling`: `now-N<unit>` to `now`, the last `amount` of `unit`
 * - `calendar`: a whole day, week, month or year, `offset` units from this one
 * - `since`: the start of this `unit` to `now` (`now/d` to `now`)
 * - `custom`: anything else
 */
export function describeTimeRange(value: TimeRangeValue): TimeRangeKind;
/** "Last 15 minutes", "Today so far", "Yesterday". `null` for a custom range. */
export function relativeRangeLabel(value: TimeRangeValue): string | null;
/**
 * "Nov 6, 09:00 – 12:30 (UTC−5)". The date shows the year when the ends are
 * in different years or `now` is in another one. A range that crosses a clock
 * change shows both offsets. Seconds show when an end has them.
 */
export function formatAbsoluteRange(
  start: Date | number,
  end: Date | number,
  options?: FormatOptions,
): string;
/**
 * The text for a trigger or a heading. A relative range of a known shape reads
 * as its name ("Last 15 minutes", "Yesterday"). Two absolute ends read as
 * `formatAbsoluteRange`. Anything else shows its bounds, with a relative one
 * as written ("now-6h – now-1h", "Nov 6, 09:00 – now").
 */
export function formatTimeRange(
  value: TimeRangeValue,
  options?: FormatOptions,
): string;
/** A rolling range: the last `amount` of `unit`, ending now. */
export function lastRange(amount: number, unit: TimeUnit): TimeRangeValue;
/**
 * A calendar range: the last `count` whole days (or weeks, months, years),
 * this one included, so `calendarRange(7, "d")` is today and the six days
 * before it. The rolling `lastRange(7, "d")` starts at this time of day a
 * week ago instead.
 */
export function calendarRange(
  count: number,
  unit: "d" | "w" | "M" | "y",
): TimeRangeValue;
/** Equal ends, as text. */
export function sameTimeRange(
  a: TimeRangeValue | null | undefined,
  b: TimeRangeValue | null | undefined,
): boolean;
/**
 * The date (`2026-11-06`) and 24-hour time (`09:30`, or `09:30:15` when it
 * has seconds) that the wall clock in `timeZone` shows at `time`, for a pair
 * of form fields.
 */
export function toDateTimeFields(
  time: Date | number,
  timeZone: string,
): {
  date: string;
  time: string;
};
/**
 * The instant two form fields name in `timeZone`; NaN when either does not
 * read. Reads `2026-11-06` and `9:30` or `09:30:15`.
 */
export function fromDateTimeFields(
  fields: {
    date: string;
    time: string;
  },
  timeZone: string,
): number;
/**
 * The IANA names the runtime knows, with `UTC` first. Engines without
 * `Intl.supportedValuesOf` list `UTC` and `extra`.
 */
export function listTimeZones(extra?: string[]): string[];
/**
 * The quick ranges a trigger offers by default. `rolling` ranges end at
 * `now`; `calendar` ranges are whole days, weeks and months in the time zone.
 */
export const defaultTimeRanges: TimeRangePreset[];
