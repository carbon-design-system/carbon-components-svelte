// @ts-check
import { resolveWeekInfo } from "../DatePicker/week-info.js";
import { BoundedFifoCache } from "./bounded-fifo-cache.js";

/**
 * Calendar math in an IANA time zone, from `Intl` alone.
 *
 * Every function takes the zone as an argument and none reads the host's:
 * the server and the browser give the same answer for the same inputs.
 * `hostTimeZone` is the one reader, for a caller that opts in.
 *
 * An instant is epoch milliseconds (a `Date` is accepted too). The shapes
 * and names follow `Temporal.ZonedDateTime`, so that this module can become
 * a thin wrapper over it once the browser floor has `Temporal`, and then go.
 * `Temporal` is in Firefox, Chromium, WebKit and Bun now, and not in Node
 * 24; the tests run both against it where it exists.
 *
 * | Here | `Temporal` |
 * | --- | --- |
 * | `zonedParts(t, tz)` | `Instant.fromEpochMilliseconds(t).toZonedDateTimeISO(tz)` fields; `weekday` is `dayOfWeek % 7` |
 * | `offsetOf(t, tz)` | `zdt.offsetNanoseconds / 1e6` |
 * | `fromZoned(parts, tz, { disambiguation })` | `ZonedDateTime.from({ timeZone: tz, ...parts }, { disambiguation }).epochMilliseconds` |
 * | `startOf("day", t, tz)` | `zdt.startOfDay()` |
 * | `startOf("hour", t, tz)` | `zdt.round({ smallestUnit: "hour", roundingMode: "floor" })` |
 * | `startOf("week" \| "month" \| "year", t, tz)` | `zdt.with({ ... }).startOfDay()`; Temporal has no week start option |
 * | `endOf(unit, t, tz)` | the start of `zdt.add({ [unit]: 1 })`'s unit, minus a millisecond |
 * | `addZoned(t, duration, tz)` | `zdt.add(duration)` |
 * | `diffCalendarDays(a, b, tz)` | `zdtA.toPlainDate().until(zdtB.toPlainDate()).days` |
 * | `dayKey(t, tz)` | `zdt.toPlainDate().toString()` |
 * | `isTimeZone`, `listTimeZones` | `Intl.DateTimeFormat`, `Intl.supportedValuesOf("timeZone")` (no change) |
 * | `resolveWeekStart(locale)` | none: `Intl.Locale.getWeekInfo()` |
 *
 * Range: years 1 to 9999 in the proleptic Gregorian calendar.
 */

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * @typedef {number | Date} Instant Epoch milliseconds.
 *
 * @typedef {object} ZonedParts The wall clock in a zone.
 * @property {number} year
 * @property {number} month 1 to 12.
 * @property {number} day 1 to 31.
 * @property {number} hour 0 to 23.
 * @property {number} minute
 * @property {number} second
 * @property {number} millisecond
 * @property {number} weekday 0 (Sunday) to 6. `Temporal`'s `dayOfWeek` is `weekday || 7`.
 *
 * @typedef {Pick<ZonedParts, "year" | "month" | "day"> & Partial<ZonedParts>} ZonedPartsInput
 *
 * @typedef {"compatible" | "earlier" | "later" | "reject"} Disambiguation
 * How `fromZoned` reads a wall time that happens twice (clocks go back) or
 * never (clocks go forward).
 *
 * @typedef {"second" | "minute" | "hour" | "day" | "week" | "month" | "year"} ZonedUnit
 *
 * @typedef {object} ZonedDuration
 * @property {number} [years]
 * @property {number} [months]
 * @property {number} [weeks]
 * @property {number} [days]
 * @property {number} [hours]
 * @property {number} [minutes]
 * @property {number} [seconds]
 * @property {number} [milliseconds]
 */

/** @param {Instant} instant */
function toMs(instant) {
  const ms = Math.floor(+instant);
  if (!Number.isFinite(ms)) throw new RangeError("Invalid instant");
  return ms;
}

/**
 * `Date.UTC`, except that years 0 to 99 stay in those years.
 *
 * @param {number} year
 * @param {number} month 1 to 12; out of range months roll over.
 * @param {number} day
 * @param {number} [hour]
 * @param {number} [minute]
 * @param {number} [second]
 * @param {number} [ms]
 */
function utc(year, month, day, hour = 0, minute = 0, second = 0, ms = 0) {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, second, ms);
  return date.getTime();
}

/** @param {number} n @param {number} [width] */
function pad(n, width = 2) {
  return String(n).padStart(width, "0");
}

// ---------------------------------------------------------------------------
// Formatters, one per zone
// ---------------------------------------------------------------------------

// A zone name is one of about 600, and `Intl` ignores its case, so the cache
// holds every zone a page can use. Bounded anyway: a zone typed by a user
// should not grow it. (`intl-formatter-cache` holds 32 and would thrash on
// a zone list.)
/** @type {BoundedFifoCache<string, Intl.DateTimeFormat>} */
const formatters = new BoundedFifoCache(512);

/**
 * @param {string} timeZone
 * @returns {Intl.DateTimeFormat}
 */
function formatterFor(timeZone) {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    // Throws a RangeError for a name the engine does not know. Not cached.
    formatter = new Intl.DateTimeFormat("en-US-u-ca-gregory-nu-latn", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

// ---------------------------------------------------------------------------
// Zones
// ---------------------------------------------------------------------------

/**
 * Whether `timeZone` is a name the engine knows.
 *
 * @param {unknown} timeZone
 * @returns {boolean}
 */
export function isTimeZone(timeZone) {
  if (typeof timeZone !== "string" || timeZone === "") return false;
  try {
    formatterFor(timeZone);
    return true;
  } catch {
    return false;
  }
}

/**
 * The host's time zone, or `"UTC"` where the engine will not say. This is
 * the only function here that reads the environment: call it in the browser
 * after mount, or pass the result in from the caller. Rendering with it on
 * the server and in the browser gives two answers.
 *
 * @returns {string}
 */
export function hostTimeZone() {
  try {
    return new Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/**
 * Names that engines disagree on: Chromium reports the pre-2022 spelling in
 * `supportedValuesOf` and `resolvedOptions` (`Asia/Calcutta`), Firefox the
 * current one (`Asia/Kolkata`), and WebKit gives back whatever was passed in.
 * All three accept both spellings as input.
 *
 * @type {Readonly<Record<string, string>>}
 */
const CURRENT_NAME = {
  "Africa/Asmera": "Africa/Asmara",
  "America/Buenos_Aires": "America/Argentina/Buenos_Aires",
  "America/Catamarca": "America/Argentina/Catamarca",
  "America/Coral_Harbour": "America/Atikokan",
  "America/Cordoba": "America/Argentina/Cordoba",
  "America/Godthab": "America/Nuuk",
  "America/Indianapolis": "America/Indiana/Indianapolis",
  "America/Jujuy": "America/Argentina/Jujuy",
  "America/Louisville": "America/Kentucky/Louisville",
  "America/Mendoza": "America/Argentina/Mendoza",
  "Asia/Calcutta": "Asia/Kolkata",
  "Asia/Katmandu": "Asia/Kathmandu",
  "Asia/Rangoon": "Asia/Yangon",
  "Asia/Saigon": "Asia/Ho_Chi_Minh",
  "Atlantic/Faeroe": "Atlantic/Faroe",
  "Europe/Kiev": "Europe/Kyiv",
  "Pacific/Enderbury": "Pacific/Kanton",
  "Pacific/Ponape": "Pacific/Pohnpei",
  "Pacific/Truk": "Pacific/Chuuk",
  "Etc/UTC": "UTC",
  "Etc/UCT": "UTC",
  "Etc/GMT": "UTC",
  "Etc/Zulu": "UTC",
  GMT: "UTC",
  UCT: "UTC",
  Zulu: "UTC",
};

/**
 * One spelling per zone, the same in every engine, for comparing a saved
 * zone with a zone from a list: `Asia/Calcutta` and `Asia/Kolkata` both give
 * `Asia/Kolkata`. Covers the names `Intl.supportedValuesOf` returns in any
 * engine; other links (`US/Eastern`) are returned as the engine resolves
 * them. Returns `undefined` for a name the engine does not know.
 *
 * @param {string} timeZone
 * @returns {string | undefined}
 */
export function normalizeTimeZone(timeZone) {
  if (!isTimeZone(timeZone)) return undefined;
  const resolved = formatterFor(timeZone).resolvedOptions().timeZone;
  const current = CURRENT_NAME[resolved];
  return current !== undefined && isTimeZone(current) ? current : resolved;
}

/**
 * The zones the engine knows, one spelling each (`normalizeTimeZone`), with
 * `UTC` first and then `extra`. Sorted. Engines without
 * `Intl.supportedValuesOf` list `UTC` and `extra`.
 *
 * @param {string[]} [extra] Names to include, such as a saved zone.
 * @returns {string[]}
 */
export function listTimeZones(extra = []) {
  knownZones ??= normalizedSet(supportedZones());
  const zones = new Set(knownZones);
  for (const name of normalizedSet(extra)) zones.add(name);
  zones.delete("UTC");
  return ["UTC", ...[...zones].sort()];
}

/** @type {Set<string> | undefined} */
let knownZones;

/** @returns {string[]} */
function supportedZones() {
  try {
    return /** @type {any} */ (Intl).supportedValuesOf("timeZone");
  } catch {
    // An older engine: the caller's names are the list.
    return [];
  }
}

/** @param {string[]} names */
function normalizedSet(names) {
  /** @type {Set<string>} */
  const set = new Set();
  for (const name of names) {
    const normal = normalizeTimeZone(name);
    if (normal !== undefined) set.add(normal);
  }
  return set;
}

// ---------------------------------------------------------------------------
// Instant <-> wall clock
// ---------------------------------------------------------------------------

/**
 * The wall clock in `timeZone` at `instant`.
 *
 * @param {Instant} instant
 * @param {string} timeZone
 * @returns {ZonedParts}
 */
export function zonedParts(instant, timeZone) {
  const ms = toMs(instant);
  /** @type {Record<string, number>} */
  const f = {};
  for (const part of formatterFor(timeZone).formatToParts(ms)) {
    if (part.type !== "literal") f[part.type] = Number(part.value);
  }
  return {
    year: f.year,
    month: f.month,
    day: f.day,
    // Some engines write midnight as 24 even with `h23`.
    hour: f.hour % 24,
    minute: f.minute,
    second: f.second,
    millisecond: ((ms % SECOND) + SECOND) % SECOND,
    weekday: new Date(utc(f.year, f.month, f.day)).getUTCDay(),
  };
}

/**
 * How far `timeZone` is ahead of UTC at `instant`, in milliseconds (negative
 * west of Greenwich). A multiple of a second: the offset of a place before
 * 1900 can have seconds.
 *
 * @param {Instant} instant
 * @param {string} timeZone
 * @returns {number}
 */
export function offsetOf(instant, timeZone) {
  const ms = toMs(instant);
  const w = zonedParts(ms, timeZone);
  return (
    utc(w.year, w.month, w.day, w.hour, w.minute, w.second) -
    (ms - w.millisecond)
  );
}

/**
 * `"UTC"`, `"UTC−5"` or `"UTC+5:45"`. The minus is U+2212, so that it never
 * reads as a hyphen.
 *
 * @param {number} offset Milliseconds, as `offsetOf` returns.
 * @returns {string}
 */
export function formatUtcOffset(offset) {
  const minutes = Math.round(offset / MINUTE);
  if (minutes === 0) return "UTC";
  const abs = Math.abs(minutes);
  const rest = abs % 60;
  return `UTC${minutes < 0 ? "−" : "+"}${Math.floor(abs / 60)}${
    rest ? `:${pad(rest)}` : ""
  }`;
}

/**
 * The instant at which the wall clock in `timeZone` reads `parts`. Missing
 * time fields are 0. Fields out of range roll over as `Date.UTC` does (day 0
 * is the last day of the month before), which makes `{ ...parts, day:
 * parts.day + 7 }` a week later.
 *
 * `disambiguation` is `Temporal`'s, and decides what a wall time that is not
 * one instant means:
 *
 * | | repeated (clocks go back) | skipped (clocks go forward) |
 * | --- | --- | --- |
 * | `"compatible"` (default) | the first | the time after the gap (02:30 is 03:30) |
 * | `"earlier"` | the first | the time before the gap (02:30 is 01:30) |
 * | `"later"` | the second | the time after the gap |
 * | `"reject"` | throws | throws |
 *
 * @param {ZonedPartsInput} parts
 * @param {string} timeZone
 * @param {{ disambiguation?: Disambiguation }} [options]
 * @returns {number}
 * @throws {RangeError} For fields that are not numbers, a zone the engine
 * does not know, or `"reject"` and a wall time that is repeated or skipped.
 */
export function fromZoned(parts, timeZone, options = {}) {
  const { disambiguation = "compatible" } = options;
  const t = utc(
    parts.year,
    parts.month,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    parts.millisecond,
  );
  if (!Number.isFinite(t)) throw new RangeError("Invalid date-time fields");
  // The instant has the wall time `t` (read as UTC) minus the offset it has.
  // The offsets a day either side are the two it can have: no zone changes
  // its offset twice inside two days.
  const before = offsetOf(t - DAY, timeZone);
  const after = offsetOf(t + DAY, timeZone);
  /** @type {number[]} */
  const valid = [];
  for (const offset of new Set([before, after])) {
    const instant = t - offset;
    if (offsetOf(instant, timeZone) === offset) valid.push(instant);
  }
  if (valid.length === 1) return valid[0];
  if (disambiguation === "reject") {
    throw new RangeError(
      `The wall time ${new Date(t).toISOString().slice(0, 23)} is ${
        valid.length === 0 ? "skipped" : "repeated"
      } in ${timeZone}`,
    );
  }
  if (valid.length === 2) {
    valid.sort((a, b) => a - b);
    return disambiguation === "later" ? valid[1] : valid[0];
  }
  // Skipped. The offset from before the gap puts the time after it.
  const later = t - before;
  const earlier = t - after;
  if (before === after) return later;
  return disambiguation === "earlier"
    ? Math.min(earlier, later)
    : Math.max(earlier, later);
}

/**
 * The calendar day at `instant` in `timeZone`, as `YYYY-MM-DD` (the text of
 * a `Temporal.PlainDate`). Two instants are on the same day when their keys
 * are equal.
 *
 * @param {Instant} instant
 * @param {string} timeZone
 * @returns {string}
 */
export function dayKey(instant, timeZone) {
  const w = zonedParts(instant, timeZone);
  return `${pad(w.year, 4)}-${pad(w.month)}-${pad(w.day)}`;
}

/**
 * The number of calendar days from the day of `from` to the day of `to` in
 * `timeZone`: 0 for any two instants on one day, 1 for 23:59 and 00:01 the
 * next, and negative when `to` is earlier. A count of days on the wall
 * calendar, whatever the hours between them: a day with a clock change is
 * 23 or 25 hours long and still one day.
 *
 * @param {Instant} from
 * @param {Instant} to
 * @param {string} timeZone
 * @returns {number}
 */
export function diffCalendarDays(from, to, timeZone) {
  const a = zonedParts(from, timeZone);
  const b = zonedParts(to, timeZone);
  return Math.round(
    (utc(b.year, b.month, b.day) - utc(a.year, a.month, a.day)) / DAY,
  );
}

// ---------------------------------------------------------------------------
// Calendar arithmetic
// ---------------------------------------------------------------------------

/**
 * First day of the week for a locale, 0 (Sunday) to 6, from the table the
 * DatePicker uses (CLDR), or from a `-u-fw-` extension in the tag
 * (`en-US-u-fw-mon` is 1).
 *
 * Not from `Intl.Locale`'s `getWeekInfo()`: every engine has it now, but
 * WebKit's data disagrees with Chromium's and Firefox's for CN, DZ and JO,
 * so the same locale would start the week on different days on the server
 * and in Safari, and apart from the DatePicker.
 *
 * @param {string} [locale]
 * @returns {number}
 */
export function resolveWeekStart(locale = "en") {
  const cached = weekStartCache.get(locale);
  if (cached !== undefined) return cached;
  const firstDay = explicitFirstDay(locale) ?? resolveWeekInfo(locale).firstDay;
  weekStartCache.set(locale, firstDay);
  return firstDay;
}

/** @type {BoundedFifoCache<string, number>} */
const weekStartCache = new BoundedFifoCache(32);

const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/**
 * The `fw` key of the Unicode extension, as in `en-u-ca-gregory-fw-mon`.
 *
 * @param {string} locale
 * @returns {number | undefined}
 */
function explicitFirstDay(locale) {
  const subtags = locale.toLowerCase().split("-");
  const start = subtags.indexOf("u");
  if (start === -1) return undefined;
  // Keys are two characters; the next singleton (`x`, `t`) ends the extension.
  for (
    let i = start + 1;
    i < subtags.length - 1 && subtags[i].length > 1;
    i++
  ) {
    if (subtags[i] === "fw") {
      const day = WEEKDAYS.indexOf(subtags[i + 1]);
      return day === -1 ? undefined : day;
    }
  }
  return undefined;
}

/** @type {Readonly<Record<"second" | "minute" | "hour", number>>} */
const FIXED = { second: SECOND, minute: MINUTE, hour: HOUR };

/**
 * The first instant of the unit that holds `instant`, in `timeZone`.
 *
 * A day starts at the first time that exists on it: in Havana and Santiago,
 * where the clocks skip midnight, that is 01:00. `second`, `minute` and
 * `hour` are elapsed units, aligned to the zone's offset, so an hour starts
 * at :00 in Kathmandu (UTC+5:45) and the repeated hour has two starts.
 *
 * @param {ZonedUnit} unit
 * @param {Instant} instant
 * @param {string} timeZone
 * @param {{ weekStart?: number }} [options] `weekStart` is 0 (Sunday) to 6;
 * default 1 (Monday), as in `Temporal` and ISO 8601. See `resolveWeekStart`.
 * @returns {number}
 */
export function startOf(unit, instant, timeZone, options = {}) {
  const { weekStart = 1 } = options;
  const ms = toMs(instant);
  if (unit === "second" || unit === "minute" || unit === "hour") {
    const step = FIXED[unit];
    const local = ms + offsetOf(ms, timeZone);
    return ms - (((local % step) + step) % step);
  }
  const w = zonedParts(ms, timeZone);
  if (unit === "day") {
    return fromZoned({ year: w.year, month: w.month, day: w.day }, timeZone);
  }
  if (unit === "week") {
    const back = (w.weekday - weekStart + 7) % 7;
    return fromZoned(
      { year: w.year, month: w.month, day: w.day - back },
      timeZone,
    );
  }
  if (unit === "month") {
    return fromZoned({ year: w.year, month: w.month, day: 1 }, timeZone);
  }
  if (unit === "year") {
    return fromZoned({ year: w.year, month: 1, day: 1 }, timeZone);
  }
  throw new RangeError(`Unknown unit: ${String(unit)}`);
}

/** @type {Readonly<Record<"day" | "week" | "month" | "year", ZonedDuration>>} */
const ONE = {
  day: { days: 1 },
  week: { weeks: 1 },
  month: { months: 1 },
  year: { years: 1 },
};

/**
 * The last millisecond of the unit that holds `instant`. For a half-open
 * range use `endOf(...) + 1`, which is the start of the next unit: not
 * `startOf(...)` plus a unit, because a day that starts at 01:00 is followed
 * by one that starts at 00:00.
 *
 * @param {ZonedUnit} unit
 * @param {Instant} instant
 * @param {string} timeZone
 * @param {{ weekStart?: number }} [options]
 * @returns {number}
 */
export function endOf(unit, instant, timeZone, options = {}) {
  const start = startOf(unit, instant, timeZone, options);
  if (unit === "second" || unit === "minute" || unit === "hour") {
    return start + FIXED[unit] - 1;
  }
  const next = startOf(
    unit,
    addZoned(start, ONE[unit], timeZone),
    timeZone,
    options,
  );
  return next - 1;
}

/**
 * Whether `value` is a whole number, which `Temporal` requires of a duration.
 *
 * @param {number | undefined} value
 * @param {string} name
 * @returns {number}
 */
function whole(value, name) {
  if (value === undefined) return 0;
  if (!Number.isInteger(value)) {
    throw new RangeError(`${name} must be a whole number`);
  }
  return value;
}

/**
 * `Temporal.ZonedDateTime.add`. Calendar units (`years`, `months`, `weeks`,
 * `days`) move the date and keep the wall clock time, so a day across a
 * clock change is 23 or 25 hours; a month or year that is shorter keeps the
 * last day (January 31 plus a month is February 28). A skipped wall time
 * reads as the time after the gap, a repeated one as the first.
 * Elapsed units (`hours`, `minutes`, `seconds`, `milliseconds`) are added
 * afterwards, as time that passes on a clock. Negative values subtract.
 *
 * @param {Instant} instant
 * @param {ZonedDuration} duration
 * @param {string} timeZone
 * @returns {number}
 * @throws {RangeError} For a duration with a fraction.
 */
export function addZoned(instant, duration, timeZone) {
  const ms = toMs(instant);
  const years = whole(duration.years, "years");
  const months = whole(duration.months, "months");
  const days =
    whole(duration.weeks, "weeks") * 7 + whole(duration.days, "days");
  const elapsed =
    whole(duration.hours, "hours") * HOUR +
    whole(duration.minutes, "minutes") * MINUTE +
    whole(duration.seconds, "seconds") * SECOND +
    whole(duration.milliseconds, "milliseconds");
  if (years === 0 && months === 0 && days === 0) return ms + elapsed;
  const w = zonedParts(ms, timeZone);
  const total = w.year * 12 + (w.month - 1) + years * 12 + months;
  const year = Math.floor(total / 12);
  const month = (((total % 12) + 12) % 12) + 1;
  const last = new Date(utc(year, month + 1, 0)).getUTCDate();
  return (
    fromZoned(
      { ...w, year, month, day: Math.min(w.day, last) + days },
      timeZone,
    ) + elapsed
  );
}
