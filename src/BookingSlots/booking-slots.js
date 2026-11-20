// @ts-check
import { getDateTimeFormatter } from "../utils/intl-formatter-cache.js";

/**
 * Availability as UTC instants, shown in a display time zone.
 *
 * A slot is an instant, so it is never a wall time that does not exist and
 * it never repeats. What changes with the zone is the calendar day a slot
 * falls on and the text of its time. Every helper here is pure and reads
 * the zone through `Intl`.
 */

const MINUTE = 60_000;
const DAY = 86_400_000;

/**
 * @typedef {Date | string | number} Instant
 * @typedef {{ start: Instant; end?: Instant }} SlotInput
 * @typedef {{ start: number; end: number; id: string }} Slot
 */

/**
 * Milliseconds since the epoch, or `NaN` for a value that is not a time.
 * @param {unknown} value
 * @returns {number}
 */
export function toMs(value) {
  if (value == null || value === "") return Number.NaN;
  return +new Date(/** @type {Date | string | number} */ (value));
}

/**
 * Whether the runtime knows `timeZone`.
 * @param {unknown} timeZone
 * @returns {boolean}
 */
export function isValidTimeZone(timeZone) {
  if (typeof timeZone !== "string" || timeZone === "") return false;
  try {
    getDateTimeFormatter("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/**
 * The wall clock in `timeZone` at `ms`.
 * @param {number} ms
 * @param {string} timeZone
 */
function wallClock(ms, timeZone) {
  const parts = getDateTimeFormatter("en-US-u-ca-gregory-nu-latn", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(ms);
  /** @type {Record<string, number>} */
  const fields = {};
  for (const { type, value } of parts) fields[type] = Number(value);
  // Some engines write midnight as 24.
  if (fields.hour === 24) fields.hour = 0;
  return fields;
}

/**
 * Minutes that `timeZone` is ahead of UTC at `ms` (negative west of it).
 * @param {number} ms
 * @param {string} timeZone
 * @returns {number}
 */
export function zoneOffset(ms, timeZone) {
  const f = wallClock(ms, timeZone);
  const wall = Date.UTC(f.year, f.month - 1, f.day, f.hour, f.minute, f.second);
  return (wall - Math.floor(ms / 1000) * 1000) / MINUTE;
}

/** @param {number} n */
function pad(n) {
  return String(n).padStart(2, "0");
}

/**
 * The calendar day at `ms` in `timeZone`, as `YYYY-MM-DD`.
 * @param {number} ms
 * @param {string} timeZone
 * @returns {string}
 */
export function dayKey(ms, timeZone) {
  const f = wallClock(ms, timeZone);
  return `${f.year}-${pad(f.month)}-${pad(f.day)}`;
}

/**
 * The calendar month at `ms` in `timeZone`, as `YYYY-MM`.
 * @param {number} ms
 * @param {string} timeZone
 * @returns {string}
 */
export function monthKey(ms, timeZone) {
  return dayKey(ms, timeZone).slice(0, 7);
}

/**
 * @param {string} day `YYYY-MM-DD`
 * @returns {{ year: number; month: number; day: number }}
 */
export function parseDay(day) {
  const [year, month, date] = day.split("-").map(Number);
  return { year, month, day: date };
}

/**
 * Move a calendar day by whole days. No zone is involved.
 * @param {string} day `YYYY-MM-DD`
 * @param {number} days
 * @returns {string}
 */
export function addDays(day, days) {
  const { year, month, day: date } = parseDay(day);
  const moved = new Date(Date.UTC(year, month - 1, date + days));
  return `${moved.getUTCFullYear()}-${pad(moved.getUTCMonth() + 1)}-${pad(moved.getUTCDate())}`;
}

/**
 * Move a calendar month by whole months.
 * @param {string} month `YYYY-MM`
 * @param {number} months
 * @returns {string}
 */
export function addMonths(month, months) {
  const [year, index] = month.split("-").map(Number);
  const moved = new Date(Date.UTC(year, index - 1 + months, 1));
  return `${moved.getUTCFullYear()}-${pad(moved.getUTCMonth() + 1)}`;
}

/**
 * Day of the week of a calendar day, 0 (Sunday) to 6.
 * @param {string} day
 * @returns {number}
 */
export function weekday(day) {
  const { year, month, day: date } = parseDay(day);
  return new Date(Date.UTC(year, month - 1, date)).getUTCDay();
}

/**
 * The instant at which the wall clock in `timeZone` reads `minutes` after
 * midnight on `day`.
 *
 * A time that happens twice (clocks go back) is the first one. A time that
 * does not exist (clocks go forward) reads as it would with the offset
 * from before the gap, so 02:30 on the night clocks go forward in New York
 * is 03:30.
 *
 * @param {string} day `YYYY-MM-DD`
 * @param {number} minutes
 * @param {string} timeZone
 * @returns {number}
 */
export function wallTimeToInstant(day, minutes, timeZone) {
  const { year, month, day: date } = parseDay(day);
  const wall = Date.UTC(year, month - 1, date, 0, minutes);
  // The offset a day either side. A zone changes its offset at most once
  // in that span, and the right one is the offset that holds at the result.
  const before = zoneOffset(wall - DAY, timeZone);
  const after = zoneOffset(wall + DAY, timeZone);
  /** @type {number[]} */
  const candidates = [];
  for (const offset of new Set([before, after])) {
    const instant = wall - offset * MINUTE;
    if (zoneOffset(instant, timeZone) === offset) candidates.push(instant);
  }
  return candidates.length > 0
    ? Math.min(...candidates)
    : wall - before * MINUTE;
}

/**
 * The first instant of `day` in `timeZone`. Where a zone skips midnight
 * (the clocks go forward at 00:00), that is the first minute that exists.
 * @param {string} day
 * @param {string} timeZone
 * @returns {number}
 */
export function startOfDay(day, timeZone) {
  return wallTimeToInstant(day, 0, timeZone);
}

/**
 * The instants of one calendar month in `timeZone`: `from` is its first
 * instant and `to` is the first instant of the next month.
 * @param {string} month `YYYY-MM`
 * @param {string} timeZone
 * @returns {{ from: number; to: number }}
 */
export function monthWindow(month, timeZone) {
  return {
    from: startOfDay(`${month}-01`, timeZone),
    to: startOfDay(`${addMonths(month, 1)}-01`, timeZone),
  };
}

/**
 * How many hours `day` has in `timeZone`: 24, or 23 and 25 where the
 * clocks change.
 * @param {string} day
 * @param {string} timeZone
 * @returns {number}
 */
export function dayLength(day, timeZone) {
  return (
    (startOfDay(addDays(day, 1), timeZone) - startOfDay(day, timeZone)) /
    (60 * MINUTE)
  );
}

/**
 * Clean up slots from a source: drop any that are not a time, end a slot
 * that has no `end` after `duration` minutes, remove duplicates by start
 * and sort by start.
 * @param {ReadonlyArray<SlotInput> | null | undefined} slots
 * @param {number} [duration] Minutes.
 * @returns {Slot[]}
 */
export function normalizeSlots(slots, duration = 30) {
  /** @type {Map<number, Slot>} */
  const byStart = new Map();
  for (const slot of slots ?? []) {
    const start = toMs(slot?.start);
    if (Number.isNaN(start) || byStart.has(start)) continue;
    const end = toMs(slot.end);
    byStart.set(start, {
      start,
      end: Number.isNaN(end) ? start + duration * MINUTE : end,
      id: new Date(start).toISOString(),
    });
  }
  return [...byStart.values()].sort((a, b) => a.start - b.start);
}

/**
 * Group slots by the calendar day they start on in `timeZone`. A slot
 * keeps its place in order within the day.
 * @param {ReadonlyArray<Slot>} slots Sorted, as `normalizeSlots` returns.
 * @param {string} timeZone
 * @returns {Record<string, Slot[]>}
 */
export function groupSlotsByDay(slots, timeZone) {
  /** @type {Record<string, Slot[]>} */
  const days = {};
  for (const slot of slots) {
    (days[dayKey(slot.start, timeZone)] ??= []).push(slot);
  }
  return days;
}

/**
 * Cut windows of free time into bookable slots.
 * @param {ReadonlyArray<{ start: Instant; end: Instant }>} windows
 * @param {{ duration?: number; step?: number }} [options] `duration` is the
 * length of a slot in minutes (default 30). `step` is the distance between
 * starts in minutes (default `duration`).
 * @returns {Slot[]}
 */
export function slotsFromWindows(windows, options = {}) {
  const { duration = 30, step = duration } = options;
  /** @type {SlotInput[]} */
  const slots = [];
  if (duration <= 0 || step <= 0) return [];
  for (const window of windows) {
    const end = toMs(window.end);
    for (
      let start = toMs(window.start);
      start + duration * MINUTE <= end;
      start += step * MINUTE
    ) {
      slots.push({ start, end: start + duration * MINUTE });
    }
  }
  return normalizeSlots(slots, duration);
}

/**
 * The text of each slot's time in `timeZone`. Where a day shows the same
 * time twice (the hour the clocks go back), those slots add the zone's
 * short name, such as "1:30 AM EDT" and "1:30 AM EST".
 * @param {ReadonlyArray<Slot>} slots The slots of one day.
 * @param {{ locale?: string; timeZone: string; hourCycle?: "h11" | "h12" | "h23" | "h24" }} options
 * @returns {string[]}
 */
export function formatSlotTimes(slots, options) {
  const { locale, timeZone, hourCycle } = options;
  const plain = getDateTimeFormatter(locale, {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hourCycle,
  });
  const labels = slots.map((slot) => plain.format(slot.start));
  const seen = new Set();
  const repeated = new Set();
  for (const label of labels) {
    (seen.has(label) ? repeated : seen).add(label);
  }
  if (repeated.size === 0) return labels;
  const named = getDateTimeFormatter(locale, {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hourCycle,
    timeZoneName: "short",
  });
  return labels.map((label, i) =>
    repeated.has(label) ? named.format(slots[i].start) : label,
  );
}

/**
 * A calendar day written for people, such as "Tue, Nov 11". The day has no
 * zone, so it reads the same wherever the page runs.
 * @param {string} day `YYYY-MM-DD`
 * @param {string | undefined} locale
 * @param {Intl.DateTimeFormatOptions} [options]
 * @returns {string}
 */
export function formatDay(
  day,
  locale,
  options = { weekday: "short", month: "short", day: "numeric" },
) {
  const { year, month, day: date } = parseDay(day);
  return getDateTimeFormatter(locale, { ...options, timeZone: "UTC" }).format(
    Date.UTC(year, month - 1, date, 12),
  );
}

/**
 * The first day after `after` that has a slot.
 * @param {Record<string, ReadonlyArray<unknown>>} days As `groupSlotsByDay` returns.
 * @param {string} after `YYYY-MM-DD`; the day itself is not a candidate.
 * @returns {string | undefined}
 */
export function nextAvailableDay(days, after) {
  let next;
  for (const day of Object.keys(days)) {
    if (day > after && (next === undefined || day < next)) next = day;
  }
  return next;
}
