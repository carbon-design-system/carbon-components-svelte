// @ts-check
// Calendar-aware time ticks: values land on real boundaries (midnight, the
// first of the month) instead of fixed millisecond multiples.
import { getDateTimeFormatter } from "../../utils/intl-formatter-cache.js";
import { ticks } from "./ticks.js";

/** @typedef {import("./time-ticks.d.ts").TimeInterval} TimeInterval */
/** @typedef {import("./time-ticks.d.ts").TimeTickOptions} TimeTickOptions */
/** @typedef {import("./time-ticks.d.ts").TimeTicks} TimeTicks */

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/** Candidate `[interval, step, approximate duration]`, ascending. */
const LADDER = /** @type {ReadonlyArray<[TimeInterval, number, number]>} */ ([
  ["second", 1, SECOND],
  ["second", 2, 2 * SECOND],
  ["second", 5, 5 * SECOND],
  ["second", 10, 10 * SECOND],
  ["second", 15, 15 * SECOND],
  ["second", 30, 30 * SECOND],
  ["minute", 1, MINUTE],
  ["minute", 2, 2 * MINUTE],
  ["minute", 5, 5 * MINUTE],
  ["minute", 10, 10 * MINUTE],
  ["minute", 15, 15 * MINUTE],
  ["minute", 30, 30 * MINUTE],
  ["hour", 1, HOUR],
  ["hour", 2, 2 * HOUR],
  ["hour", 3, 3 * HOUR],
  ["hour", 6, 6 * HOUR],
  ["hour", 12, 12 * HOUR],
  ["day", 1, DAY],
  ["day", 2, 2 * DAY],
  ["week", 1, WEEK],
  ["month", 1, MONTH],
  ["month", 3, 3 * MONTH],
  ["year", 1, YEAR],
]);

/**
 * Largest boundary of `interval` at or before `ms`, aligned to `step`.
 * Uses `Date` setters rather than millisecond math so 23 and 25 hour DST
 * days stay aligned to local midnight.
 *
 * @param {number} ms
 * @param {TimeInterval} interval
 * @param {number} step
 * @param {boolean} utc
 * @param {0 | 1} weekStart
 * @returns {Date}
 */
function floorTo(ms, interval, step, utc, weekStart) {
  const date = new Date(ms);
  const year = utc ? date.getUTCFullYear() : date.getFullYear();
  const month = utc ? date.getUTCMonth() : date.getMonth();
  const day = utc ? date.getUTCDate() : date.getDate();
  const hour = utc ? date.getUTCHours() : date.getHours();
  const minute = utc ? date.getUTCMinutes() : date.getMinutes();
  const second = utc ? date.getUTCSeconds() : date.getSeconds();
  const make = utc
    ? (/** @type {number[]} */ ...parts) =>
        new Date(
          Date.UTC(
            parts[0],
            parts[1] ?? 0,
            parts[2] ?? 1,
            parts[3] ?? 0,
            parts[4] ?? 0,
            parts[5] ?? 0,
          ),
        )
    : (/** @type {number[]} */ ...parts) =>
        new Date(
          parts[0],
          parts[1] ?? 0,
          parts[2] ?? 1,
          parts[3] ?? 0,
          parts[4] ?? 0,
          parts[5] ?? 0,
        );

  switch (interval) {
    case "year":
      return make(year - (year % step));
    case "month":
      return make(year, month - (month % step));
    case "week": {
      const weekday = utc ? date.getUTCDay() : date.getDay();
      return make(year, month, day - ((weekday - weekStart + 7) % 7));
    }
    case "day":
      // Align multi-day steps to the month so ticks read 1, 3, 5 …
      return make(year, month, day - ((day - 1) % step));
    case "hour":
      return make(year, month, day, hour - (hour % step));
    case "minute":
      return make(year, month, day, hour, minute - (minute % step));
    default:
      return make(year, month, day, hour, minute, second - (second % step));
  }
}

/**
 * Advance `date` by `step` units of `interval`, in place.
 *
 * @param {Date} date
 * @param {TimeInterval} interval
 * @param {number} step
 * @param {boolean} utc
 */
function advance(date, interval, step, utc) {
  switch (interval) {
    case "year":
      if (utc) date.setUTCFullYear(date.getUTCFullYear() + step);
      else date.setFullYear(date.getFullYear() + step);
      break;
    case "month":
      if (utc) date.setUTCMonth(date.getUTCMonth() + step);
      else date.setMonth(date.getMonth() + step);
      break;
    case "week":
      if (utc) date.setUTCDate(date.getUTCDate() + step * 7);
      else date.setDate(date.getDate() + step * 7);
      break;
    case "day":
      if (utc) date.setUTCDate(date.getUTCDate() + step);
      else date.setDate(date.getDate() + step);
      break;
    case "hour":
      date.setTime(date.getTime() + step * HOUR);
      break;
    case "minute":
      date.setTime(date.getTime() + step * MINUTE);
      break;
    default:
      date.setTime(date.getTime() + step * SECOND);
  }
}

/**
 * Pick the interval and step whose tick count is nearest `count`.
 *
 * @param {number} span Milliseconds.
 * @param {number} count
 * @returns {[TimeInterval, number]}
 */
function pickInterval(span, count) {
  const target = span / Math.max(1, count);
  const last = LADDER[LADDER.length - 1];

  if (target > last[2]) {
    // Beyond yearly: 1, 2, 5 multiples of years.
    const years = ticks(0, span / YEAR, count);
    return ["year", Math.max(1, years.length > 1 ? years[1] - years[0] : 1)];
  }

  let best = LADDER[0];
  let bestRatio = Number.POSITIVE_INFINITY;
  for (const rung of LADDER) {
    const ratio = Math.abs(Math.log(rung[2] / target));
    if (ratio < bestRatio) {
      best = rung;
      bestRatio = ratio;
    }
  }
  return [best[0], best[1]];
}

/**
 * Widen `[start, end]` outward to the calendar boundaries its ticks use.
 * Bounds must be ascending.
 *
 * @param {number} start
 * @param {number} end
 * @param {number} [count]
 * @param {TimeTickOptions} [options]
 * @returns {[number, number]}
 */
export function niceTimeDomain(start, end, count = 6, options = {}) {
  const { utc = false, weekStart = 0 } = options;
  if (!Number.isFinite(start) || !Number.isFinite(end) || !(end > start)) {
    return [start, end];
  }
  const [interval, step] = pickInterval(end - start, count);
  const lo = floorTo(start, interval, step, utc, weekStart);
  const hi = floorTo(end, interval, step, utc, weekStart);
  if (hi.getTime() < end) advance(hi, interval, step, utc);
  return [lo.getTime(), hi.getTime()];
}

/**
 * About `count` tick values across `[start, end]` on calendar boundaries,
 * in local time unless `utc` is set. Bounds may be given in either order.
 *
 * @param {Date | number} start
 * @param {Date | number} end
 * @param {number} [count]
 * @param {TimeTickOptions} [options]
 * @returns {TimeTicks}
 */
export function timeTicks(start, end, count = 6, options = {}) {
  const { utc = false, weekStart = 0 } = options;
  const lo = Math.min(+start, +end);
  const hi = Math.max(+start, +end);
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
    return { interval: "day", step: 1, values: [] };
  }
  if (lo === hi) return { interval: "day", step: 1, values: [lo] };

  const [interval, step] = pickInterval(hi - lo, count);
  const cursor = floorTo(lo, interval, step, utc, weekStart);
  if (cursor.getTime() < lo) advance(cursor, interval, step, utc);

  /** @type {number[]} */
  const values = [];
  // A day-of-month step restarts each month so labels stay on 1, 3, 5 …
  let month = utc ? cursor.getUTCMonth() : cursor.getMonth();
  while (cursor.getTime() <= hi) {
    values.push(cursor.getTime());
    advance(cursor, interval, step, utc);
    if (interval === "day" && step > 1) {
      const next = utc ? cursor.getUTCMonth() : cursor.getMonth();
      if (next !== month) {
        if (utc) cursor.setUTCDate(1);
        else cursor.setDate(1);
        month = next;
      }
    }
  }
  return { interval, step, values };
}

/** @type {Record<TimeInterval, Intl.DateTimeFormatOptions>} */
const FORMATS = {
  second: { hour: "numeric", minute: "2-digit", second: "2-digit" },
  minute: { hour: "numeric", minute: "2-digit" },
  hour: { hour: "numeric" },
  day: { month: "short", day: "numeric" },
  week: { month: "short", day: "numeric" },
  month: { month: "short" },
  year: { year: "numeric" },
};

/**
 * Tick label formatter matched to `interval`, backed by the shared
 * `Intl.DateTimeFormat` cache.
 *
 * @param {TimeInterval} interval
 * @param {string} [locale]
 * @param {{ utc?: boolean }} [options]
 * @returns {(ms: number) => string}
 */
export function timeTickFormat(interval, locale, options = {}) {
  const formatter = getDateTimeFormatter(locale, {
    ...FORMATS[interval],
    ...(options.utc ? { timeZone: "UTC" } : null),
  });
  return (ms) => formatter.format(ms);
}
