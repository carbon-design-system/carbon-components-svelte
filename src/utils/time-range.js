// @ts-check
import { resolveWeekInfo } from "../DatePicker/week-info.js";
import { BoundedFifoCache } from "./bounded-fifo-cache.js";
import { getDateTimeFormatter } from "./intl-formatter-cache.js";

/**
 * One end of a range: an absolute instant (`"2026-11-06T14:00:00.000Z"`) or a
 * relative expression (`"now-15m"`, `"now/d"`), as Grafana and Elasticsearch
 * write them.
 *
 * @typedef {string} TimeBound
 */

/**
 * @typedef {object} TimeRangeValue
 * @property {TimeBound} from
 * @property {TimeBound} to
 */

/**
 * @typedef {object} ResolvedRange
 * @property {Date} start
 * @property {Date} end - The last instant of the range. A bound rounded up
 *   (`now/d` as `to`) ends one millisecond before the next unit starts.
 */

/** `s`, `m`, `h` count elapsed time. `d`, `w`, `M`, `y` are calendar units in the time zone. */
/** @typedef {"s" | "m" | "h" | "d" | "w" | "M" | "y"} TimeUnit */

/**
 * @typedef {object} ResolveOptions
 * @property {Date | number | string} [now] - The instant `now` stands for. Default: the current time.
 * @property {string} [timeZone] - IANA name. Default `"UTC"`.
 * @property {number} [weekStart] - First day of the week, 0 (Sunday) to 6. Default: the locale's, else Monday.
 * @property {string} [locale] - Picks `weekStart` when that is unset.
 */

/**
 * @typedef {{ n: number, unit: TimeUnit }} ParsedAdd
 * @typedef {{ unit: TimeUnit }} ParsedRound
 * @typedef {{ type: "add" } & ParsedAdd | { type: "round" } & ParsedRound} ParsedOp
 */

/**
 * A parsed bound. `anchor` is `"now"` or an epoch time. A bound with no
 * `offset` (a date such as `2026-11-06`) reads in the time zone, and `dateOnly`
 * makes `to` mean the end of that day.
 *
 * @typedef {object} ParsedBound
 * @property {"now" | "instant" | "wall"} kind
 * @property {number} [epoch] - `instant`: epoch milliseconds.
 * @property {WallTime} [wall] - `wall`: a date and time with no offset, read in the zone.
 * @property {boolean} [dateOnly]
 * @property {ParsedOp[]} ops
 */

/**
 * @typedef {object} WallTime
 * @property {number} year
 * @property {number} month - 1 to 12.
 * @property {number} day
 * @property {number} hour
 * @property {number} minute
 * @property {number} second
 * @property {number} ms
 */

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const FIXED_MS = { s: SECOND, m: MINUTE, h: HOUR };

const UNIT_PATTERN = "[smhdwMy]";
const OP_PATTERN = new RegExp(`^([+-])(\\d+)(${UNIT_PATTERN})`);
const ROUND_PATTERN = new RegExp(`^/(${UNIT_PATTERN})`);

// Whitespace is collapsed to one space before these run, so none repeats.
const RANGE_SEPARATORS = [/ to /i, /\.\./, / [-\u2013\u2014] /];
const NOW_PREFIX = /^now/i;
const NOW_ONLY = /^now$/i;
const SPACE_BEFORE_DIGIT = /^\s+(?=\d)/;
const WHITESPACE = /\s+/g;
const EPOCH = /^\d{11,}$/;
const ROLLING_TEXT = /^(?:last|past|previous) (\d+) ?([a-z]+)$/;
const CALENDAR_TEXT = /^(this|last|previous|next) (day|week|month|year)$/;
const DURATION = /^\s*(\d+)\s*([smhdwMy])\s*$/;
const TRAILING_BOUND = /^now-(\d+)([smhdwMy])$/;
const CALENDAR_BOUND = /^now(?:([+-]\d+)([dwMy]))?\/([dwMy])$/;

const UNIT_NAMES = {
  s: "second",
  m: "minute",
  h: "hour",
  d: "day",
  w: "week",
  M: "month",
  y: "year",
};

// ---------------------------------------------------------------------------
// Time zones
// ---------------------------------------------------------------------------

/**
 * @param {number} year
 * @param {number} month - 1 to 12
 * @param {number} day
 * @param {number} [hour]
 * @param {number} [minute]
 * @param {number} [second]
 * @param {number} [ms]
 * @returns {number} UTC milliseconds, for any year (`Date.UTC` maps 0 to 99 onto 1900s).
 */
function utc(year, month, day, hour = 0, minute = 0, second = 0, ms = 0) {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, second, ms);
  return date.getTime();
}

/**
 * Whether `timeZone` is an IANA name the runtime knows.
 *
 * @param {string} timeZone
 * @returns {boolean}
 */
export function isTimeZone(timeZone) {
  try {
    getDateTimeFormatter("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** @param {string} timeZone */
function zoneFormatter(timeZone) {
  return getDateTimeFormatter("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  });
}

/**
 * The wall clock in `timeZone` at the instant `time`.
 *
 * @param {number} time - Epoch milliseconds.
 * @param {string} timeZone
 * @returns {WallTime}
 */
export function wallTime(time, timeZone) {
  /** @type {Record<string, number>} */
  const parts = {};
  for (const part of zoneFormatter(timeZone).formatToParts(time)) {
    if (part.type !== "literal") parts[part.type] = Number(part.value);
  }
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    // Some engines write midnight as 24 even with `h23`.
    hour: parts.hour % 24,
    minute: parts.minute,
    second: parts.second,
    ms: ((time % SECOND) + SECOND) % SECOND,
  };
}

/**
 * The offset from UTC in `timeZone` at the instant `time`, in milliseconds.
 *
 * @param {number} time
 * @param {string} timeZone
 */
function offsetAt(time, timeZone) {
  const w = wallTime(time, timeZone);
  return utc(w.year, w.month, w.day, w.hour, w.minute, w.second, w.ms) - time;
}

/**
 * The offset from UTC in minutes (negative west of Greenwich).
 *
 * @param {Date | number} date
 * @param {string} timeZone
 * @returns {number}
 */
export function timeZoneOffset(date, timeZone) {
  return Math.round(offsetAt(+date, timeZone) / MINUTE);
}

/**
 * `"UTC"`, `"UTC−5"` or `"UTC+5:30"`. The minus is U+2212, so it never reads
 * as a hyphen.
 *
 * @param {number} minutes
 * @returns {string}
 */
export function formatUtcOffset(minutes) {
  if (minutes === 0) return "UTC";
  const abs = Math.abs(minutes);
  const rest = abs % 60;
  return `UTC${minutes < 0 ? "−" : "+"}${Math.floor(abs / 60)}${
    rest ? `:${String(rest).padStart(2, "0")}` : ""
  }`;
}

/**
 * The instant at which the wall clock in `timeZone` reads `wall`. A time that
 * happens twice (clocks go back) is the first one. A time that never happens
 * (clocks go forward) is read with the offset from before the change, so it
 * lands on the same wall time as the gap's end: 02:30 becomes 03:30.
 *
 * @param {WallTime} wall
 * @param {string} timeZone
 * @returns {number}
 */
export function instantFromWall(wall, timeZone) {
  const t = utc(
    wall.year,
    wall.month,
    wall.day,
    wall.hour,
    wall.minute,
    wall.second,
    wall.ms,
  );
  // No zone changes its offset twice within two days, so the offsets a day
  // either side are the two the wall time can have.
  const before = offsetAt(t - DAY, timeZone);
  const after = offsetAt(t + DAY, timeZone);
  const candidates = before === after ? [before] : [before, after];
  const valid = candidates
    .map((offset) => t - offset)
    .filter((instant) => offsetAt(instant, timeZone) === t - instant);
  if (valid.length === 0) return t - before;
  return Math.min(...valid);
}

// ---------------------------------------------------------------------------
// Calendar arithmetic
// ---------------------------------------------------------------------------

/**
 * First day of the week for a locale, 0 (Sunday) to 6. Reads `Intl.Locale`
 * where the engine has it and falls back to the table the DatePicker uses.
 *
 * @param {string} [locale]
 * @returns {number}
 */
export function resolveWeekStart(locale = "en") {
  const cached = weekStartCache.get(locale);
  if (cached !== undefined) return cached;
  const firstDay = readWeekStart(locale);
  weekStartCache.set(locale, firstDay);
  return firstDay;
}

/** @type {BoundedFifoCache<string, number>} */
const weekStartCache = new BoundedFifoCache(32);

/** @param {string} locale */
function readWeekStart(locale) {
  try {
    const intlLocale = new Intl.Locale(locale);
    const locale_ = /** @type {any} */ (intlLocale);
    /** @type {{ firstDay?: number } | undefined} */
    const info =
      typeof locale_.getWeekInfo === "function"
        ? locale_.getWeekInfo()
        : locale_.weekInfo;
    // Intl numbers the week 1 (Monday) to 7 (Sunday).
    if (info && typeof info.firstDay === "number") return info.firstDay % 7;
  } catch {
    // Fall through to the table.
  }
  return resolveWeekInfo(locale).firstDay;
}

/**
 * @param {number} time
 * @param {string} timeZone
 */
function startOfDay(time, timeZone) {
  const w = wallTime(time, timeZone);
  return instantFromWall(
    { ...w, hour: 0, minute: 0, second: 0, ms: 0 },
    timeZone,
  );
}

/**
 * The start of the unit after the one that starts at `start`. Not `start`
 * plus one unit: a day that starts at 01:00 because midnight never happened
 * is followed by one that starts at 00:00.
 *
 * @param {number} start
 * @param {TimeUnit} unit
 * @param {string} timeZone
 * @param {number} weekStart
 * @returns {number}
 */
function nextStart(start, unit, timeZone, weekStart) {
  const moved = add(start, 1, unit, timeZone);
  return FIXED_MS[/** @type {"s" | "m" | "h"} */ (unit)] === undefined
    ? startOf(moved, unit, timeZone, weekStart)
    : moved;
}

/**
 * The first instant of the unit that holds `time`, in `timeZone`.
 *
 * @param {number} time
 * @param {TimeUnit} unit
 * @param {string} timeZone
 * @param {number} weekStart
 * @returns {number}
 */
function startOf(time, unit, timeZone, weekStart) {
  if (unit === "s" || unit === "m" || unit === "h") {
    // Elapsed units stay aligned to the zone's offset, which is constant
    // inside an hour, so the second pass through 01:00 keeps its own hour.
    const step = FIXED_MS[unit];
    const offset = offsetAt(time, timeZone);
    return time - ((((time + offset) % step) + step) % step);
  }
  const w = wallTime(time, timeZone);
  if (unit === "d") return startOfDay(time, timeZone);
  if (unit === "w") {
    const weekday = new Date(utc(w.year, w.month, w.day)).getUTCDay();
    const back = (weekday - weekStart + 7) % 7;
    const day = new Date(utc(w.year, w.month, w.day - back));
    return instantFromWall(
      {
        year: day.getUTCFullYear(),
        month: day.getUTCMonth() + 1,
        day: day.getUTCDate(),
        hour: 0,
        minute: 0,
        second: 0,
        ms: 0,
      },
      timeZone,
    );
  }
  if (unit === "M") {
    return instantFromWall(
      {
        year: w.year,
        month: w.month,
        day: 1,
        hour: 0,
        minute: 0,
        second: 0,
        ms: 0,
      },
      timeZone,
    );
  }
  return instantFromWall(
    { year: w.year, month: 1, day: 1, hour: 0, minute: 0, second: 0, ms: 0 },
    timeZone,
  );
}

/**
 * Move by `n` units. `s`, `m`, `h` add elapsed time. `d`, `w`, `M`, `y` keep
 * the wall-clock time of day, so a day across a clock change is 23 or 25
 * hours long. A month or year that is shorter keeps the last day of it
 * (January 31 plus a month is February 28).
 *
 * @param {number} time
 * @param {number} n
 * @param {TimeUnit} unit
 * @param {string} timeZone
 * @returns {number}
 */
function add(time, n, unit, timeZone) {
  if (unit === "s" || unit === "m" || unit === "h") {
    return time + n * FIXED_MS[unit];
  }
  const w = wallTime(time, timeZone);
  if (unit === "d" || unit === "w") {
    const moved = new Date(
      utc(w.year, w.month, w.day + n * (unit === "w" ? 7 : 1)),
    );
    return instantFromWall(
      {
        ...w,
        year: moved.getUTCFullYear(),
        month: moved.getUTCMonth() + 1,
        day: moved.getUTCDate(),
      },
      timeZone,
    );
  }
  const months = unit === "y" ? n * 12 : n;
  const total = w.year * 12 + (w.month - 1) + months;
  const year = Math.floor(total / 12);
  const month = (((total % 12) + 12) % 12) + 1;
  const last = new Date(utc(year, month + 1, 0)).getUTCDate();
  return instantFromWall(
    { ...w, year, month, day: Math.min(w.day, last) },
    timeZone,
  );
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

const ISO_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:[.,](\d{1,9}))?)?)?\s*(Z|[+-]\d{2}(?::?\d{2})?)?$/i;

/**
 * Reads a bound: `now`, `now-15m`, `now-1d/d`, `now+1h`, an ISO date or date
 * and time (`2026-11-06`, `2026-11-06T09:00`, `2026-11-06 09:00:00-05:00`) or
 * epoch milliseconds. A date and time with no offset reads in the time zone
 * the range is resolved in. Returns `null` for anything else.
 *
 * Whitespace is ignored. A `+` that a URL decoded to a space still counts:
 * `now 1h` is `now+1h`.
 *
 * @param {string} text
 * @returns {ParsedBound | null}
 */
export function parseTimeBound(text) {
  if (typeof text !== "string") return null;
  const trimmed = text.trim();
  if (trimmed === "") return null;

  if (NOW_PREFIX.test(trimmed)) {
    let rest = trimmed.slice(3).replace(SPACE_BEFORE_DIGIT, "+");
    rest = rest.replace(WHITESPACE, "");
    /** @type {ParsedOp[]} */
    const ops = [];
    while (rest) {
      const op = OP_PATTERN.exec(rest);
      if (op) {
        const n = Number(op[2]);
        ops.push({
          type: "add",
          n: op[1] === "-" ? -n : n,
          unit: /** @type {TimeUnit} */ (op[3]),
        });
        rest = rest.slice(op[0].length);
        continue;
      }
      const round = ROUND_PATTERN.exec(rest);
      if (round) {
        ops.push({ type: "round", unit: /** @type {TimeUnit} */ (round[1]) });
        rest = rest.slice(round[0].length);
        continue;
      }
      return null;
    }
    return { kind: "now", ops };
  }

  if (EPOCH.test(trimmed)) {
    const epoch = Number(trimmed);
    return Number.isSafeInteger(epoch)
      ? { kind: "instant", epoch, ops: [] }
      : null;
  }

  const iso = ISO_PATTERN.exec(trimmed);
  if (!iso) return null;
  const [, y, mo, d, h, mi, s, frac, zone] = iso;
  const wall = {
    year: Number(y),
    month: Number(mo),
    day: Number(d),
    hour: h ? Number(h) : 0,
    minute: mi ? Number(mi) : 0,
    second: s ? Number(s) : 0,
    ms: frac ? Math.floor(Number(`0.${frac}`) * 1000) : 0,
  };
  if (
    wall.month < 1 ||
    wall.month > 12 ||
    wall.day < 1 ||
    wall.day > new Date(utc(wall.year, wall.month + 1, 0)).getUTCDate() ||
    wall.hour > 23 ||
    wall.minute > 59 ||
    wall.second > 59
  ) {
    return null;
  }
  if (!zone) return { kind: "wall", wall, dateOnly: h === undefined, ops: [] };
  let offset = 0;
  if (zone.toUpperCase() !== "Z") {
    const digits = zone.slice(1).replace(":", "");
    const hours = Number(digits.slice(0, 2));
    const minutes = Number(digits.slice(2) || 0);
    if (hours > 23 || minutes > 59) return null;
    offset = (zone[0] === "-" ? -1 : 1) * (hours * HOUR + minutes * MINUTE);
  }
  return {
    kind: "instant",
    epoch:
      utc(
        wall.year,
        wall.month,
        wall.day,
        wall.hour,
        wall.minute,
        wall.second,
        wall.ms,
      ) - offset,
    ops: [],
  };
}

/**
 * A bound in its plain form: a relative one without spaces (`now - 1d / d`
 * and `now 1h` become `now-1d/d` and `now+1h`), any other trimmed. Text that
 * does not read comes back trimmed.
 *
 * @param {string} text
 * @returns {string}
 */
export function normalizeTimeBound(text) {
  const trimmed = String(text).trim();
  if (!NOW_PREFIX.test(trimmed) || !parseTimeBound(trimmed)) return trimmed;
  return `now${trimmed
    .slice(3)
    .replace(SPACE_BEFORE_DIGIT, "+")
    .replace(WHITESPACE, "")}`;
}

/**
 * Whether `text` reads as a bound.
 *
 * @param {string} text
 * @returns {boolean}
 */
export function isTimeBound(text) {
  return parseTimeBound(text) !== null;
}

const KEYWORD_UNITS = {
  s: "s",
  m: "m",
  h: "h",
  d: "d",
  w: "w",
  y: "y",
  second: "s",
  seconds: "s",
  sec: "s",
  secs: "s",
  minute: "m",
  minutes: "m",
  min: "m",
  mins: "m",
  hour: "h",
  hours: "h",
  hr: "h",
  hrs: "h",
  day: "d",
  days: "d",
  week: "w",
  weeks: "w",
  wk: "w",
  wks: "w",
  month: "M",
  months: "M",
  year: "y",
  years: "y",
  yr: "y",
  yrs: "y",
};

const CALENDAR_KEYWORDS = { day: "d", week: "w", month: "M", year: "y" };

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
 *
 * @param {string} text
 * @returns {TimeRangeValue | null}
 */
export function parseTimeRangeText(text) {
  if (typeof text !== "string") return null;
  const lower = text.trim().toLowerCase().replace(WHITESPACE, " ");
  if (!lower) return null;

  const rolling = ROLLING_TEXT.exec(lower);
  if (rolling) {
    const unit =
      KEYWORD_UNITS[/** @type {keyof typeof KEYWORD_UNITS} */ (rolling[2])];
    if (unit && Number(rolling[1]) > 0) {
      return { from: `now-${Number(rolling[1])}${unit}`, to: "now" };
    }
    return null;
  }
  if (lower === "today") return { from: "now/d", to: "now/d" };
  if (lower === "yesterday") return { from: "now-1d/d", to: "now-1d/d" };
  const calendar = CALENDAR_TEXT.exec(lower);
  if (calendar) {
    const unit =
      CALENDAR_KEYWORDS[
        /** @type {keyof typeof CALENDAR_KEYWORDS} */ (calendar[2])
      ];
    const shift =
      calendar[1] === "this" ? "" : calendar[1] === "next" ? "+1" : "-1";
    const bound = `now${shift}${shift ? unit : ""}/${unit}`;
    return { from: bound, to: bound };
  }

  // Original casing matters for `M` and `m`.
  const original = text.trim().replace(WHITESPACE, " ");
  for (const separator of RANGE_SEPARATORS) {
    const halves = original.split(separator);
    if (
      halves.length === 2 &&
      isTimeBound(halves[0]) &&
      isTimeBound(halves[1])
    ) {
      return {
        from: normalizeTimeBound(halves[0]),
        to: normalizeTimeBound(halves[1]),
      };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Resolving
// ---------------------------------------------------------------------------

/**
 * @param {ResolveOptions} options
 * @returns {{ now: number, timeZone: string, weekStart: number }}
 */
function normalizeOptions(options) {
  const timeZone = options.timeZone || "UTC";
  return {
    now: options.now === undefined ? Date.now() : +new Date(options.now),
    timeZone,
    weekStart: options.weekStart ?? resolveWeekStart(options.locale),
  };
}

/**
 * @param {ParsedBound} parsed
 * @param {"from" | "to"} side
 * @param {{ now: number, timeZone: string, weekStart: number }} context
 * @returns {number}
 */
function evaluate(parsed, side, context) {
  const { now, timeZone, weekStart } = context;
  let time = now;
  if (parsed.kind === "instant") time = /** @type {number} */ (parsed.epoch);
  if (parsed.kind === "wall") {
    time = instantFromWall(/** @type {WallTime} */ (parsed.wall), timeZone);
    if (parsed.dateOnly && side === "to") {
      time = add(time, 1, "d", timeZone) - 1;
    }
  }
  parsed.ops.forEach((op, index) => {
    if (op.type === "add") {
      time = add(time, op.n, op.unit, timeZone);
      return;
    }
    const start = startOf(time, op.unit, timeZone, weekStart);
    // A rounding that ends the bound, on the end of a range, rounds up.
    time =
      side === "to" && index === parsed.ops.length - 1
        ? nextStart(start, op.unit, timeZone, weekStart) - 1
        : start;
  });
  return time;
}

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
 *
 * @param {TimeRangeValue} value
 * @param {ResolveOptions} [options]
 * @returns {ResolvedRange}
 */
export function resolveRange(value, options = {}) {
  const context = normalizeOptions(options);
  const resolve = (
    /** @type {TimeBound} */ bound,
    /** @type {"from" | "to"} */ side,
  ) => {
    const parsed = parseTimeBound(bound);
    return new Date(parsed ? evaluate(parsed, side, context) : Number.NaN);
  };
  return { start: resolve(value.from, "from"), end: resolve(value.to, "to") };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * What is wrong with a range. `"too-long"` and `"too-short"` are about its
 * length, `"before-min"` and `"after-max"` about its bounds.
 *
 * @typedef {"invalid-from" | "invalid-to" | "order" | "before-min" | "after-max" | "too-long" | "too-short"} TimeRangeProblem
 */

/**
 * @typedef {ResolveOptions & {
 *   min?: Date | number | string,
 *   max?: Date | number | string,
 *   maxRange?: string | number,
 *   minRange?: string | number,
 * }} ValidateOptions
 */

/**
 * Reads a length: milliseconds, or `"90m"`, `"7d"`, `"2w"`, `"3M"`.
 *
 * @param {string | number} duration
 * @returns {{ n: number, unit: TimeUnit | "ms" } | null}
 */
function parseDurationParts(duration) {
  if (typeof duration === "number") {
    return Number.isFinite(duration) ? { n: duration, unit: "ms" } : null;
  }
  const match = DURATION.exec(duration);
  return match
    ? { n: Number(match[1]), unit: /** @type {TimeUnit} */ (match[2]) }
    : null;
}

/**
 * A length in milliseconds, for `"90m"`, `"7d"` or `"2w"` (`d` is 24 hours
 * and `w` is 7 days here). Months and years have no fixed length: NaN.
 *
 * @param {string | number} duration
 * @returns {number}
 */
export function parseDuration(duration) {
  const parts = parseDurationParts(duration);
  if (!parts) return Number.NaN;
  if (parts.unit === "ms") return parts.n;
  if (parts.unit === "M" || parts.unit === "y") return Number.NaN;
  return parts.n * { ...FIXED_MS, d: DAY, w: 7 * DAY }[parts.unit];
}

/**
 * The instant a length after `start` ends, counted as the range's own units
 * do: hours elapsed, days and longer on the calendar in the zone, so a limit
 * of `"7d"` holds "Last 7 days" through a clock change.
 *
 * @param {number} start
 * @param {string | number} duration
 * @param {string} timeZone
 */
function durationEnd(start, duration, timeZone) {
  const parts = parseDurationParts(duration);
  if (!parts) return Number.NaN;
  return parts.unit === "ms"
    ? start + parts.n
    : add(start, parts.n, parts.unit, timeZone);
}

/**
 * @param {Date | number | string} limit
 * @param {"from" | "to"} side
 * @param {{ now: number, timeZone: string, weekStart: number }} context
 */
function resolveLimit(limit, side, context) {
  if (typeof limit === "string") {
    const parsed = parseTimeBound(limit);
    return parsed ? evaluate(parsed, side, context) : Number.NaN;
  }
  return +limit;
}

/**
 * Checks a range: both ends read, the end is after the start, and the range
 * stays inside `min`, `max` and the length limits. `min` and `max` can be
 * bounds themselves (`max: "now"`, `min: "now-30d"` for a retention window).
 *
 * @param {TimeRangeValue} value
 * @param {ValidateOptions} [options]
 * @returns {{ valid: true } | { valid: false, problem: TimeRangeProblem }}
 */
export function validateRange(value, options = {}) {
  const context = normalizeOptions(options);
  const { start, end } = resolveRange(value, options);
  if (Number.isNaN(+start)) return { valid: false, problem: "invalid-from" };
  if (Number.isNaN(+end)) return { valid: false, problem: "invalid-to" };
  if (+end <= +start) return { valid: false, problem: "order" };
  if (options.min !== undefined) {
    const min = resolveLimit(options.min, "from", context);
    if (+start < min) return { valid: false, problem: "before-min" };
  }
  if (options.max !== undefined) {
    const max = resolveLimit(options.max, "to", context);
    if (+end > max) return { valid: false, problem: "after-max" };
  }
  // The last instant of a range rounded up is a millisecond short of a whole
  // unit, so a day-long range is not longer than "1d".
  const last = inclusiveEnd(+end);
  if (
    options.maxRange !== undefined &&
    last > durationEnd(+start, options.maxRange, context.timeZone)
  ) {
    return { valid: false, problem: "too-long" };
  }
  if (
    options.minRange !== undefined &&
    last < durationEnd(+start, options.minRange, context.timeZone)
  ) {
    return { valid: false, problem: "too-short" };
  }
  return { valid: true };
}

// ---------------------------------------------------------------------------
// Stepping and zooming
// ---------------------------------------------------------------------------

/** @param {number} time */
const iso = (time) => new Date(time).toISOString();

/**
 * The end of a range rounded up is its last millisecond (`.999`), so its
 * length counts that one too.
 *
 * @param {number} end
 */
const inclusiveEnd = (end) => (end % SECOND === SECOND - 1 ? end + 1 : end);

/**
 * Whether the range is whole days, weeks, months or years: it starts at the
 * start of a day in the zone and ends one millisecond before the start of
 * one. Returns the size to move by, `{ n, unit }`.
 *
 * @param {number} start
 * @param {number} end
 * @param {string} timeZone
 * @returns {{ n: number, unit: "d" | "M" } | null}
 */
function wholeCalendarSpan(start, end, timeZone) {
  const next = end + 1;
  if (startOf(start, "d", timeZone, 0) !== start) return null;
  if (startOf(next, "d", timeZone, 0) !== next) return null;
  const from = wallTime(start, timeZone);
  const to = wallTime(next, timeZone);
  if (from.day === 1 && to.day === 1) {
    return {
      n: (to.year - from.year) * 12 + (to.month - from.month),
      unit: "M",
    };
  }
  const days = Math.round(
    (utc(to.year, to.month, to.day) - utc(from.year, from.month, from.day)) /
      DAY,
  );
  return { n: days, unit: "d" };
}

/**
 * @typedef {ResolveOptions & {
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
 *
 * @param {TimeRangeValue} value
 * @param {-1 | 1} direction
 * @param {StepOptions} [options]
 * @returns {TimeRangeValue | null}
 */
export function stepRange(value, direction, options = {}) {
  const context = normalizeOptions(options);
  const { start, end } = resolveRange(value, options);
  if (Number.isNaN(+start) || Number.isNaN(+end) || +end <= +start) return null;
  const max =
    options.max === undefined
      ? Number.POSITIVE_INFINITY
      : resolveLimit(options.max, "to", context);
  if (direction > 0 && +end >= max) return null;

  const span = wholeCalendarSpan(+start, +end, context.timeZone);
  let from;
  let to;
  if (span) {
    const n = direction * span.n;
    // Land on the start of a day, not on the time of day the old start had:
    // where clocks change at midnight, a day starts at 01:00.
    from = startOf(
      add(+start, n, span.unit, context.timeZone),
      "d",
      context.timeZone,
      0,
    );
    to =
      startOf(
        add(+end + 1, n, span.unit, context.timeZone),
        "d",
        context.timeZone,
        0,
      ) - 1;
  } else {
    const length = inclusiveEnd(+end) - +start;
    from = +start + direction * length;
    to = +end + direction * length;
  }
  if (to > max) {
    from -= to - max;
    to = max;
  }
  return { from: iso(from), to: iso(to) };
}

/**
 * Widens a range around its middle by `factor` (2 doubles it; below 1 zooms
 * in). The result is absolute, except for the commonest case: `now-15m` to
 * `now` zooms to `now-30m` to `now`, so a shared link keeps following the
 * clock. `max` works as in `stepRange`.
 *
 * @param {TimeRangeValue} value
 * @param {number} [factor]
 * @param {StepOptions} [options]
 * @returns {TimeRangeValue | null}
 */
export function zoomRange(value, factor = 2, options = {}) {
  const context = normalizeOptions(options);
  const { start, end } = resolveRange(value, options);
  if (
    Number.isNaN(+start) ||
    Number.isNaN(+end) ||
    +end <= +start ||
    !(factor > 0)
  ) {
    return null;
  }
  const trailing = TRAILING_BOUND.exec(value.from.trim());
  if (
    trailing &&
    NOW_ONLY.test(value.to.trim()) &&
    Number.isInteger(Number(trailing[1]) * factor)
  ) {
    return {
      from: `now-${Number(trailing[1]) * factor}${trailing[2]}`,
      to: "now",
    };
  }
  const max =
    options.max === undefined
      ? Number.POSITIVE_INFINITY
      : resolveLimit(options.max, "to", context);
  const length = inclusiveEnd(+end) - +start;
  const middle = +start + length / 2;
  let from = Math.round(middle - (length * factor) / 2);
  let to =
    Math.round(middle + (length * factor) / 2) -
    (inclusiveEnd(+end) === +end ? 0 : 1);
  if (to > max) {
    from -= to - max;
    to = max;
  }
  return { from: iso(from), to: iso(to) };
}

// ---------------------------------------------------------------------------
// Serializing
// ---------------------------------------------------------------------------

const SEPARATOR = "..";

/**
 * The string form of a range for a URL or a form field: `now-15m..now`, or
 * `2026-11-06T14:00:00.000Z..2026-11-06T17:30:00.000Z`. `..` appears in no
 * bound.
 *
 * @param {TimeRangeValue} value
 * @returns {string}
 */
export function serializeTimeRange(value) {
  return `${value.from.trim()}${SEPARATOR}${value.to.trim()}`;
}

/**
 * Reads what `serializeTimeRange` wrote. Also reads `from/to` written the
 * long way, and `now-15m to now`. Returns `null` for text that is not a
 * range, so a hand-edited URL never throws.
 *
 * @param {string | null | undefined} text
 * @returns {TimeRangeValue | null}
 */
export function parseTimeRange(text) {
  if (typeof text !== "string") return null;
  const halves = text.split(SEPARATOR);
  if (halves.length === 2 && isTimeBound(halves[0]) && isTimeBound(halves[1])) {
    return {
      from: normalizeTimeBound(halves[0]),
      to: normalizeTimeBound(halves[1]),
    };
  }
  return parseTimeRangeText(text);
}

/**
 * @typedef {object} TimeRangeParamNames
 * @property {string} [from] - Default `"from"`.
 * @property {string} [to] - Default `"to"`.
 * @property {string} [timeZone] - Default `"tz"`.
 */

/**
 * Writes a range as `from`, `to` and (when given) `tz` query parameters, the
 * shape Grafana's URLs have. `+` is encoded, so `now+1h` survives.
 *
 * @param {TimeRangeValue} value
 * @param {{ timeZone?: string, params?: URLSearchParams, names?: TimeRangeParamNames }} [options]
 * @returns {URLSearchParams}
 */
export function timeRangeToSearchParams(value, options = {}) {
  const params = options.params ?? new URLSearchParams();
  const names = { from: "from", to: "to", timeZone: "tz", ...options.names };
  params.set(names.from, value.from);
  params.set(names.to, value.to);
  if (options.timeZone) params.set(names.timeZone, options.timeZone);
  else params.delete(names.timeZone);
  return params;
}

/**
 * Reads what `timeRangeToSearchParams` wrote. Returns `null` when a bound is
 * missing or does not read; an unknown `tz` is left out rather than failing.
 *
 * @param {URLSearchParams | string} params
 * @param {{ names?: TimeRangeParamNames }} [options]
 * @returns {{ value: TimeRangeValue, timeZone?: string } | null}
 */
export function timeRangeFromSearchParams(params, options = {}) {
  const search =
    typeof params === "string" ? new URLSearchParams(params) : params;
  const names = { from: "from", to: "to", timeZone: "tz", ...options.names };
  const from = search.get(names.from);
  const to = search.get(names.to);
  if (from === null || to === null || !isTimeBound(from) || !isTimeBound(to))
    return null;
  const timeZone = search.get(names.timeZone);
  return {
    value: { from: normalizeTimeBound(from), to: normalizeTimeBound(to) },
    ...(timeZone && isTimeZone(timeZone) ? { timeZone } : {}),
  };
}

// ---------------------------------------------------------------------------
// Describing and formatting
// ---------------------------------------------------------------------------

/**
 * What a range is, for a label:
 *
 * - `rolling`: `now-N<unit>` to `now`, the last `amount` of `unit`
 * - `calendar`: a whole day, week, month or year, `offset` units from this one
 * - `since`: the start of this `unit` to `now` (`now/d` to `now`)
 * - `custom`: anything else
 *
 * @typedef {{ kind: "rolling", amount: number, unit: TimeUnit }
 *   | { kind: "calendar", offset: number, unit: "d" | "w" | "M" | "y" }
 *   | { kind: "since", unit: "d" | "w" | "M" | "y" }
 *   | { kind: "custom" }} TimeRangeKind
 */

/**
 * @param {TimeRangeValue} value
 * @returns {TimeRangeKind}
 */
export function describeTimeRange(value) {
  const from = value.from.replace(WHITESPACE, "");
  const to = value.to.replace(WHITESPACE, "");
  const rolling = TRAILING_BOUND.exec(from);
  if (rolling && NOW_ONLY.test(to) && Number(rolling[1]) > 0) {
    return {
      kind: "rolling",
      amount: Number(rolling[1]),
      unit: /** @type {TimeUnit} */ (rolling[2]),
    };
  }
  const calendar = CALENDAR_BOUND.exec(from);
  if (calendar && (calendar[2] === undefined || calendar[2] === calendar[3])) {
    const unit = /** @type {"d" | "w" | "M" | "y"} */ (calendar[3]);
    if (from === to) {
      return {
        kind: "calendar",
        offset: calendar[1] ? Number(calendar[1]) : 0,
        unit,
      };
    }
    if (!calendar[1] && NOW_ONLY.test(to)) return { kind: "since", unit };
  }
  return { kind: "custom" };
}

/**
 * English labels for the whole calendar units `describeTimeRange` names,
 * keyed by unit and offset. An app translates through `rangeText` on the
 * component.
 *
 * @type {Record<string, string>}
 */
const CALENDAR_LABELS = {
  "d:0": "Today",
  "d:-1": "Yesterday",
  "w:0": "This week",
  "w:-1": "Previous week",
  "M:0": "This month",
  "M:-1": "Previous month",
  "y:0": "This year",
  "y:-1": "Previous year",
};

/**
 * "Last 15 minutes", "Today so far", "Yesterday". `null` for a custom range.
 *
 * @param {TimeRangeValue} value
 * @returns {string | null}
 */
export function relativeRangeLabel(value) {
  const kind = describeTimeRange(value);
  if (kind.kind === "rolling") {
    const name = UNIT_NAMES[kind.unit];
    return `Last ${kind.amount} ${name}${kind.amount === 1 ? "" : "s"}`;
  }
  if (kind.kind === "since")
    return `${CALENDAR_LABELS[`${kind.unit}:0`]} so far`;
  if (kind.kind === "calendar") {
    const label = CALENDAR_LABELS[`${kind.unit}:${kind.offset}`];
    if (label) return label;
    const count = Math.abs(kind.offset);
    const name = UNIT_NAMES[kind.unit];
    return kind.offset < 0
      ? `${count} ${name}${count === 1 ? "" : "s"} ago`
      : `In ${count} ${name}${count === 1 ? "" : "s"}`;
  }
  return null;
}

/**
 * @typedef {ResolveOptions & {
 *   locale?: string,
 *   hourCycle?: "h12" | "h23",
 *   seconds?: boolean,
 * }} FormatOptions
 */

/**
 * "Nov 6, 09:00 – 12:30 (UTC−5)". The date shows the year when the ends are
 * in different years or `now` is in another one. A range that crosses a clock
 * change shows both offsets. Seconds show when an end has them.
 *
 * @param {Date | number} start
 * @param {Date | number} end
 * @param {FormatOptions} [options]
 * @returns {string}
 */
export function formatAbsoluteRange(start, end, options = {}) {
  const { locale = "en", timeZone = "UTC", hourCycle = "h23" } = options;
  const s = wallTime(+start, timeZone);
  const e = wallTime(+end, timeZone);
  const withSeconds = options.seconds ?? (s.second !== 0 || e.second !== 0);
  const year =
    s.year !== e.year ||
    (options.now !== undefined &&
      wallTime(+new Date(options.now), timeZone).year !== s.year);
  const date = (/** @type {number} */ time, /** @type {boolean} */ withYear) =>
    getDateTimeFormatter(locale, {
      timeZone,
      month: "short",
      day: "numeric",
      ...(withYear ? { year: "numeric" } : {}),
    }).format(time);
  const clock = (/** @type {number} */ time) =>
    getDateTimeFormatter(locale, {
      timeZone,
      hourCycle,
      hour: hourCycle === "h23" ? "2-digit" : "numeric",
      minute: "2-digit",
      ...(withSeconds ? { second: "2-digit" } : {}),
    }).format(time);
  const sameDay = s.year === e.year && s.month === e.month && s.day === e.day;
  const offsetStart = timeZoneOffset(start, timeZone);
  const offsetEnd = timeZoneOffset(end, timeZone);
  const offset =
    offsetStart === offsetEnd
      ? formatUtcOffset(offsetStart)
      : `${formatUtcOffset(offsetStart)}/${formatUtcOffset(offsetEnd)}`;
  const text = sameDay
    ? `${date(+start, year)}, ${clock(+start)} – ${clock(+end)}`
    : `${date(+start, year)}, ${clock(+start)} – ${date(+end, year)}, ${clock(+end)}`;
  return `${text} (${offset})`;
}

/**
 * The text for a trigger or a heading. A relative range of a known shape reads
 * as its name ("Last 15 minutes", "Yesterday"). Two absolute ends read as
 * `formatAbsoluteRange`. Anything else shows its bounds, with a relative one
 * as written ("now-6h – now-1h", "Nov 6, 09:00 – now").
 *
 * @param {TimeRangeValue} value
 * @param {FormatOptions} [options]
 * @returns {string}
 */
export function formatTimeRange(value, options = {}) {
  const named = relativeRangeLabel(value);
  if (named) return named;
  const from = parseTimeBound(value.from);
  const to = parseTimeBound(value.to);
  if (from && to && from.kind !== "now" && to.kind !== "now") {
    const { start, end } = resolveRange(value, options);
    return formatAbsoluteRange(start, end, options);
  }
  const { locale = "en", timeZone = "UTC", hourCycle = "h23" } = options;
  const show = (
    /** @type {TimeBound} */ bound,
    /** @type {ParsedBound | null} */ parsed,
  ) => {
    if (!parsed || parsed.kind === "now") return bound.replace(WHITESPACE, "");
    const time = +resolveRange({ from: bound, to: bound }, options).start;
    return getDateTimeFormatter(locale, {
      timeZone,
      hourCycle,
      month: "short",
      day: "numeric",
      hour: hourCycle === "h23" ? "2-digit" : "numeric",
      minute: "2-digit",
    }).format(time);
  };
  return `${show(value.from, from)} – ${show(value.to, to)}`;
}

/**
 * The quick ranges a trigger offers by default. `rolling` ranges end at
 * `now`; `calendar` ranges are whole days, weeks and months in the time zone.
 *
 * @typedef {object} TimeRangePreset
 * @property {string} id
 * @property {string} text
 * @property {TimeBound} from
 * @property {TimeBound} to
 * @property {string} [group]
 */

/** @type {TimeRangePreset[]} */
export const defaultTimeRanges = [
  {
    id: "5m",
    text: "Last 5 minutes",
    from: "now-5m",
    to: "now",
    group: "Rolling",
  },
  {
    id: "15m",
    text: "Last 15 minutes",
    from: "now-15m",
    to: "now",
    group: "Rolling",
  },
  {
    id: "1h",
    text: "Last 1 hour",
    from: "now-1h",
    to: "now",
    group: "Rolling",
  },
  {
    id: "24h",
    text: "Last 24 hours",
    from: "now-24h",
    to: "now",
    group: "Rolling",
  },
  {
    id: "7d",
    text: "Last 7 days",
    from: "now-7d",
    to: "now",
    group: "Rolling",
  },
  {
    id: "30d",
    text: "Last 30 days",
    from: "now-30d",
    to: "now",
    group: "Rolling",
  },
  { id: "today", text: "Today", from: "now/d", to: "now/d", group: "Calendar" },
  {
    id: "yesterday",
    text: "Yesterday",
    from: "now-1d/d",
    to: "now-1d/d",
    group: "Calendar",
  },
  {
    id: "this-week",
    text: "This week",
    from: "now/w",
    to: "now/w",
    group: "Calendar",
  },
];

/**
 * A rolling range: the last `amount` of `unit`, ending now.
 *
 * @param {number} amount
 * @param {TimeUnit} unit
 * @returns {TimeRangeValue}
 */
export function lastRange(amount, unit) {
  return { from: `now-${amount}${unit}`, to: "now" };
}

/**
 * A calendar range: the last `count` whole days (or weeks, months, years),
 * this one included, so `calendarRange(7, "d")` is today and the six days
 * before it. The rolling `lastRange(7, "d")` starts at this time of day a
 * week ago instead.
 *
 * @param {number} count
 * @param {"d" | "w" | "M" | "y"} unit
 * @returns {TimeRangeValue}
 */
export function calendarRange(count, unit) {
  return { from: `now-${count - 1}${unit}/${unit}`, to: `now/${unit}` };
}

/**
 * Equal ends, as text.
 *
 * @param {TimeRangeValue | null | undefined} a
 * @param {TimeRangeValue | null | undefined} b
 * @returns {boolean}
 */
export function sameTimeRange(a, b) {
  if (!a || !b) return a === b;
  return a.from.trim() === b.from.trim() && a.to.trim() === b.to.trim();
}

// ---------------------------------------------------------------------------
// Form fields
// ---------------------------------------------------------------------------

const DATE_FIELD = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_FIELD = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;

/** @param {number} n @param {number} [width] */
const pad = (n, width = 2) => String(n).padStart(width, "0");

/**
 * The date (`2026-11-06`) and 24-hour time (`09:30`, or `09:30:15` when it
 * has seconds) that the wall clock in `timeZone` shows at `time`, for a pair
 * of form fields.
 *
 * @param {Date | number} time
 * @param {string} timeZone
 * @returns {{ date: string, time: string }}
 */
export function toDateTimeFields(time, timeZone) {
  const w = wallTime(+time, timeZone);
  return {
    date: `${pad(w.year, 4)}-${pad(w.month)}-${pad(w.day)}`,
    time: `${pad(w.hour)}:${pad(w.minute)}${w.second ? `:${pad(w.second)}` : ""}`,
  };
}

/**
 * The instant two form fields name in `timeZone`; NaN when either does not
 * read. Reads `2026-11-06` and `9:30` or `09:30:15`.
 *
 * @param {{ date: string, time: string }} fields
 * @param {string} timeZone
 * @returns {number}
 */
export function fromDateTimeFields(fields, timeZone) {
  const date = DATE_FIELD.exec(fields.date.trim());
  const time = TIME_FIELD.exec(fields.time.trim());
  if (!date || !time) return Number.NaN;
  const wall = {
    year: Number(date[1]),
    month: Number(date[2]),
    day: Number(date[3]),
    hour: Number(time[1]),
    minute: Number(time[2]),
    second: time[3] ? Number(time[3]) : 0,
    ms: 0,
  };
  if (
    wall.month < 1 ||
    wall.month > 12 ||
    wall.day < 1 ||
    wall.day > new Date(utc(wall.year, wall.month + 1, 0)).getUTCDate() ||
    wall.hour > 23 ||
    wall.minute > 59 ||
    wall.second > 59
  ) {
    return Number.NaN;
  }
  return instantFromWall(wall, timeZone);
}

/**
 * The IANA names the runtime knows, with `UTC` first. Engines without
 * `Intl.supportedValuesOf` list `UTC` and `extra`.
 *
 * @param {string[]} [extra] - Names to include, such as the browser's zone.
 * @returns {string[]}
 */
export function listTimeZones(extra = []) {
  /** @type {string[]} */
  let known = [];
  try {
    known = /** @type {any} */ (Intl).supportedValuesOf("timeZone");
  } catch {
    // An older engine: the caller's names are the list.
  }
  return [...new Set(["UTC", ...extra, ...known])];
}
