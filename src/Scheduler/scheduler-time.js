// @ts-check
import { getDateTimeFormatter } from "../utils/intl-formatter-cache.js";

export const MINUTE_MS = 60_000;
export const DAY_MS = 86_400_000;
export const MINUTES_PER_DAY = 1440;

/**
 * A calendar day is an integer: the days since 1970-01-01 of the wall-clock
 * date in the display zone. Adding days to it never meets a DST change, and
 * two events are on the same day when their numbers are equal.
 *
 * @typedef {number} CivilDay
 */

/**
 * @typedef {object} Zone
 * @property {string | undefined} timeZone - IANA name, or `undefined` for the browser's local zone.
 * @property {(ms: number) => { day: CivilDay; minute: number }} parts - The wall-clock day and minute of the day an instant falls on.
 * @property {(day: CivilDay, minute: number) => number} instant - The instant of a wall-clock time. A minute outside `[0, 1440)` rolls into the next or previous day.
 */

/**
 * @param {number} year
 * @param {number} month Zero-based.
 * @param {number} date
 * @returns {CivilDay}
 */
export function civilDay(year, month, date) {
  return Math.floor(Date.UTC(year, month, date) / DAY_MS);
}

/**
 * The `{ year, month, date }` of a day, month zero-based.
 *
 * @param {CivilDay} day
 */
export function dayFields(day) {
  const utc = new Date(day * DAY_MS);
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth(),
    date: utc.getUTCDate(),
  };
}

/**
 * 0 = Sunday, like `Date.prototype.getDay()`.
 *
 * @param {CivilDay} day
 */
export function weekdayOf(day) {
  return (((day + 4) % 7) + 7) % 7;
}

/**
 * The first day of the week that holds `day`.
 *
 * @param {CivilDay} day
 * @param {number} firstDay 0 = Sunday.
 */
export function startOfWeek(day, firstDay) {
  return day - ((weekdayOf(day) - firstDay + 7) % 7);
}

/** @type {Zone} */
const LOCAL_ZONE = {
  timeZone: undefined,
  parts(ms) {
    const date = new Date(ms);
    return {
      day: civilDay(date.getFullYear(), date.getMonth(), date.getDate()),
      minute: date.getHours() * 60 + date.getMinutes(),
    };
  },
  // The Date constructor reads its arguments as local time. A time in the
  // hour a spring-forward skips lands after the gap, and a time in the hour
  // a fall-back repeats takes the first of the two, as `Temporal`'s
  // "compatible" disambiguation does.
  instant(day, minute) {
    const { year, month, date } = dayFields(day);
    return new Date(year, month, date, 0, minute).getTime();
  },
};

/** @type {Map<string, Zone>} */
const zones = new Map();

/**
 * @param {string} timeZone
 * @returns {Zone}
 */
function createNamedZone(timeZone) {
  const formatter = getDateTimeFormatter("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  });

  /**
   * The wall-clock fields of `ms`, read as if they were UTC.
   * @param {number} ms
   */
  function wall(ms) {
    let year = 1970;
    let month = 1;
    let date = 1;
    let hour = 0;
    let minute = 0;
    let second = 0;
    for (const part of formatter.formatToParts(ms)) {
      const value = Number(part.value);
      if (part.type === "year") year = value;
      else if (part.type === "month") month = value;
      else if (part.type === "day") date = value;
      else if (part.type === "hour") hour = value % 24;
      else if (part.type === "minute") minute = value;
      else if (part.type === "second") second = value;
    }
    return Date.UTC(year, month - 1, date, hour, minute, second);
  }

  /** @param {number} ms */
  function offset(ms) {
    const whole = Math.floor(ms / 1000) * 1000;
    return wall(whole) - whole;
  }

  return {
    timeZone,
    parts(ms) {
      const w = wall(ms);
      const day = Math.floor(w / DAY_MS);
      return { day, minute: Math.floor((w - day * DAY_MS) / MINUTE_MS) };
    },
    instant(day, minute) {
      // The wall time read as UTC, then corrected by the offset on either
      // side of it. The offsets differ only within a day of a transition.
      const guess = day * DAY_MS + minute * MINUTE_MS;
      const before = offset(guess - DAY_MS);
      const after = offset(guess + DAY_MS);
      if (before === after) return guess - before;
      const early = guess - before;
      const late = guess - after;
      const earlyHolds = offset(early) === before;
      const lateHolds = offset(late) === after;
      // A repeated time holds under both offsets: take the first. A skipped
      // time holds under neither: the pre-transition offset puts it after
      // the gap.
      if (earlyHolds && lateHolds) return Math.min(early, late);
      return lateHolds ? late : early;
    },
  };
}

/**
 * Whether `timeZone` is a name `Intl` knows.
 *
 * @param {string} timeZone
 */
function isKnownZone(timeZone) {
  try {
    getDateTimeFormatter("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/**
 * The zone for an IANA name such as `"America/New_York"`. `undefined`, `""`
 * and a name `Intl` does not know give the browser's local zone, which uses
 * the native `Date` and costs no formatting.
 *
 * @param {string | undefined} timeZone
 * @returns {Zone}
 */
export function getZone(timeZone) {
  if (!timeZone) return LOCAL_ZONE;
  let zone = zones.get(timeZone);
  if (!zone) {
    zone = isKnownZone(timeZone) ? createNamedZone(timeZone) : LOCAL_ZONE;
    zones.set(timeZone, zone);
  }
  return zone;
}

/**
 * A locale `Intl` accepts: the given tag, else `"en"`.
 *
 * @param {string | undefined} locale
 * @returns {string}
 */
export function resolveLocale(locale) {
  if (!locale) return "en";
  try {
    return Intl.DateTimeFormat.supportedLocalesOf(locale).length > 0
      ? locale
      : "en";
  } catch {
    return "en";
  }
}

/**
 * The clock the axis and the event times show.
 *
 * @param {"auto" | "12" | "24"} hourFormat
 * @param {string} locale
 * @returns {"12" | "24"}
 */
export function resolveHourCycle(hourFormat, locale) {
  if (hourFormat === "12" || hourFormat === "24") return hourFormat;
  try {
    const { hourCycle } = getDateTimeFormatter(locale, {
      hour: "numeric",
    }).resolvedOptions();
    return hourCycle === "h11" || hourCycle === "h12" ? "12" : "24";
  } catch {
    return "12";
  }
}

/**
 * The clock options. `hour12: false` shows midnight as "24:00" in some
 * engines and locales, so a 24-hour clock names `h23` instead.
 *
 * @param {"12" | "24"} hourCycle
 * @returns {Intl.DateTimeFormatOptions}
 */
function clockOptions(hourCycle) {
  return hourCycle === "12" ? { hour12: true } : { hourCycle: "h23" };
}

/**
 * @param {string} locale
 * @param {string | undefined} timeZone
 * @param {"12" | "24"} hourCycle
 */
export function timeFormatter(locale, timeZone, hourCycle) {
  return getDateTimeFormatter(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
    ...clockOptions(hourCycle),
  });
}

/**
 * Formats the hour labels of the axis. The hours are wall-clock, not
 * instants, so they format as UTC and never meet a DST gap.
 *
 * @param {string} locale
 * @param {"12" | "24"} hourCycle
 * @returns {(minute: number) => string}
 */
export function axisFormatter(locale, hourCycle) {
  const format = getDateTimeFormatter(locale, {
    timeZone: "UTC",
    hour: "numeric",
    minute: "2-digit",
    ...clockOptions(hourCycle),
  });
  const hourOnly = getDateTimeFormatter(locale, {
    timeZone: "UTC",
    hour: "numeric",
    ...clockOptions(hourCycle),
  });
  return (minute) => {
    const date = new Date(Date.UTC(2000, 0, 1, 0, minute));
    return (minute % 60 === 0 ? hourOnly : format).format(date);
  };
}

/**
 * @param {string} locale
 * @param {string | undefined} timeZone
 * @param {Intl.DateTimeFormatOptions} fields
 */
export function dateFormatter(locale, timeZone, fields) {
  return getDateTimeFormatter(locale, { ...fields, timeZone });
}

/**
 * Formats a civil day with `Intl`. The day's fields format as UTC, so the
 * result never shifts with the browser's zone.
 *
 * @param {string} locale
 * @param {Intl.DateTimeFormatOptions} fields
 * @returns {(day: CivilDay) => string}
 */
export function dayFormatter(locale, fields) {
  const format = getDateTimeFormatter(locale, { ...fields, timeZone: "UTC" });
  return (day) => format.format(new Date(day * DAY_MS));
}

/**
 * The shape of one day on the wall clock. A day is usually 1440 minutes
 * long, but a DST change makes it 1380 or 1500.
 *
 * `skipped` lists the wall-clock ranges that do not exist on a
 * spring-forward day, as `[from, to)` minutes. A fall-back day repeats an
 * hour instead; it has no skipped range and a `length` of 1500.
 *
 * @param {Zone} zone
 * @param {CivilDay} day
 * @returns {{ length: number; skipped: Array<[number, number]> }}
 */
export function dayInfo(zone, day) {
  const length = (zone.instant(day + 1, 0) - zone.instant(day, 0)) / MINUTE_MS;
  /** @type {Array<[number, number]>} */
  const skipped = [];
  if (length >= MINUTES_PER_DAY) return { length, skipped };
  for (let minute = 0; minute < MINUTES_PER_DAY; minute += 15) {
    const landed = zone.parts(zone.instant(day, minute));
    if (landed.day === day && landed.minute === minute) continue;
    const last = skipped[skipped.length - 1];
    if (last && last[1] === minute) last[1] = minute + 15;
    else skipped.push([minute, minute + 15]);
  }
  return { length, skipped };
}
