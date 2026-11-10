// @ts-check
// RFC 5545 recurrence rules: parse and format a supported subset, and list
// the dates a rule produces. Dates are counted on the calendar (year, month,
// day), never as milliseconds, so a daylight saving change cannot move an
// occurrence to the neighboring day.

/**
 * @typedef {"MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU"} Weekday
 * @typedef {"DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"} RecurrenceFrequency
 * @typedef {{ day: Weekday; nth?: number }} RecurrenceWeekday
 * @typedef {{
 *   freq: RecurrenceFrequency;
 *   interval: number;
 *   byDay?: RecurrenceWeekday[];
 *   byMonthDay?: number[];
 *   byMonth?: number[];
 *   weekStart?: Weekday;
 *   count?: number;
 *   until?: Date;
 * }} RecurrenceRule
 * @typedef {{ year: number; month: number; day: number }} CalendarDay
 */

/** Indexed like `Date#getDay()`. @type {readonly Weekday[]} */
export const WEEKDAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

const FREQUENCIES = new Set(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]);
const MS_PER_DAY = 86_400_000;
/** Periods with no date in a row, before a rule is taken to never match. */
const MAX_EMPTY_PERIODS = 1000;
const POSITIVE_INTEGER = /^[1-9]\d{0,5}$/;
const SIGNED_INTEGER = /^-?\d{1,2}$/;
const BYDAY_TOKEN = /^([+-]?\d{1,2})?(MO|TU|WE|TH|FR|SA|SU)$/;
const RRULE_PREFIX = /^RRULE:/;
const UNTIL_VALUE = /^(\d{4})(\d{2})(\d{2})(?:T\d{6}Z?)?$/;

/** @param {number} year @param {number} month 0-based @param {number} day */
function dayNumber(year, month, day) {
  return Math.floor(Date.UTC(year, month, day) / MS_PER_DAY);
}

/** @param {number} number @returns {CalendarDay} */
function fromDayNumber(number) {
  const date = new Date(number * MS_PER_DAY);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth(),
    day: date.getUTCDate(),
  };
}

/** 0 is Sunday, as in `Date#getDay()`. 1970-01-01 was a Thursday. */
const weekdayOf = (/** @type {number} */ number) =>
  (((number + 4) % 7) + 7) % 7;

/** @param {number} year @param {number} month */
export function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/** @param {number} value @param {number} min @param {number} max */
const inRange = (value, min, max) =>
  Number.isInteger(value) && value >= min && value <= max;

/**
 * Reads an RFC 5545 `RRULE`. Returns `null` for text that is not a rule, and
 * for a rule that uses anything outside the supported subset:
 *
 * - `FREQ` of `DAILY`, `WEEKLY`, `MONTHLY` or `YEARLY`
 * - `INTERVAL`, and one of `COUNT` or `UNTIL` (a date, or a date-time whose
 *   date is kept)
 * - `BYDAY`, with an ordinal such as `3TU` or `-1FR` on a monthly rule or a
 *   yearly rule with `BYMONTH`
 * - `BYMONTHDAY`, `-1` meaning the last day, on a monthly or yearly rule
 * - `BYMONTH` on a yearly rule, and `WKST`
 *
 * `BYSETPOS`, `BYYEARDAY`, `BYWEEKNO`, the time parts, `HOURLY` and finer
 * frequencies, `BYDAY` with `BYMONTHDAY` together, and `BYDAY` on a daily
 * rule are not supported.
 *
 * @param {string} text with or without the `RRULE:` prefix
 * @returns {RecurrenceRule | null}
 */
export function parseRRule(text) {
  const source = text.trim().toUpperCase().replace(RRULE_PREFIX, "");
  if (!source) return null;
  /** @type {Record<string, string>} */
  const parts = {};
  for (const part of source.split(";")) {
    const at = part.indexOf("=");
    if (at < 1 || at === part.length - 1) return null;
    const key = part.slice(0, at);
    if (key in parts) return null;
    parts[key] = part.slice(at + 1);
  }
  const known = [
    "FREQ",
    "INTERVAL",
    "COUNT",
    "UNTIL",
    "BYDAY",
    "BYMONTHDAY",
    "BYMONTH",
    "WKST",
  ];
  if (Object.keys(parts).some((key) => !known.includes(key))) return null;

  const freq = parts.FREQ;
  if (!FREQUENCIES.has(freq)) return null;
  /** @type {RecurrenceRule} */
  const rule = {
    freq: /** @type {RecurrenceFrequency} */ (freq),
    interval: 1,
  };

  if (parts.INTERVAL !== undefined) {
    if (!POSITIVE_INTEGER.test(parts.INTERVAL)) return null;
    rule.interval = Number(parts.INTERVAL);
  }
  if (parts.COUNT !== undefined && parts.UNTIL !== undefined) return null;
  if (parts.COUNT !== undefined) {
    if (!POSITIVE_INTEGER.test(parts.COUNT)) return null;
    rule.count = Number(parts.COUNT);
  }
  if (parts.UNTIL !== undefined) {
    const until = UNTIL_VALUE.exec(parts.UNTIL);
    if (!until) return null;
    const [, year, month, day] = until.map(Number);
    if (
      !inRange(month, 1, 12) ||
      !inRange(day, 1, daysInMonth(year, month - 1))
    ) {
      return null;
    }
    rule.until = new Date(year, month - 1, day);
  }
  if (parts.WKST !== undefined) {
    if (!WEEKDAYS.includes(/** @type {Weekday} */ (parts.WKST))) return null;
    rule.weekStart = /** @type {Weekday} */ (parts.WKST);
  }

  if (parts.BYMONTHDAY !== undefined) {
    if (freq !== "MONTHLY" && freq !== "YEARLY") return null;
    const days = parts.BYMONTHDAY.split(",");
    if (!days.every((day) => SIGNED_INTEGER.test(day))) return null;
    const numbers = days.map(Number);
    if (!numbers.every((day) => day !== 0 && inRange(day, -31, 31)))
      return null;
    rule.byMonthDay = numbers;
  }
  if (parts.BYMONTH !== undefined) {
    if (freq !== "YEARLY") return null;
    const months = parts.BYMONTH.split(",").map(Number);
    if (!months.every((month) => inRange(month, 1, 12))) return null;
    rule.byMonth = months;
  }
  if (parts.BYDAY !== undefined) {
    if (freq === "DAILY") return null;
    if (rule.byMonthDay) return null;
    /** @type {RecurrenceWeekday[]} */
    const byDay = [];
    for (const token of parts.BYDAY.split(",")) {
      const match = BYDAY_TOKEN.exec(token);
      if (!match) return null;
      const day = /** @type {Weekday} */ (match[2]);
      if (match[1] === undefined) {
        byDay.push({ day });
        continue;
      }
      const nth = Number(match[1]);
      const ordinalAllowed =
        freq === "MONTHLY" || (freq === "YEARLY" && rule.byMonth);
      if (!ordinalAllowed || nth === 0 || !inRange(nth, -5, 5)) return null;
      byDay.push({ day, nth });
    }
    rule.byDay = byDay;
  }
  return rule;
}

/** @param {Date} date */
function untilText(date) {
  const pad = (/** @type {number} */ n, size = 2) =>
    String(n).padStart(size, "0");
  return `${pad(date.getFullYear(), 4)}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

/**
 * Writes a rule as an RFC 5545 `RRULE` value, without the `RRULE:` prefix.
 * `INTERVAL=1` is left out. `UNTIL` is written as a date, which fits an
 * all-day event; for a timed event, convert it to a UTC date-time.
 *
 * @param {RecurrenceRule} rule
 * @returns {string}
 */
export function formatRRule(rule) {
  const parts = [`FREQ=${rule.freq}`];
  if (rule.interval > 1) parts.push(`INTERVAL=${rule.interval}`);
  if (rule.byMonth?.length) parts.push(`BYMONTH=${rule.byMonth.join(",")}`);
  if (rule.byMonthDay?.length) {
    parts.push(`BYMONTHDAY=${rule.byMonthDay.join(",")}`);
  }
  if (rule.byDay?.length) {
    parts.push(
      `BYDAY=${rule.byDay.map(({ day, nth }) => `${nth ?? ""}${day}`).join(",")}`,
    );
  }
  if (rule.weekStart) parts.push(`WKST=${rule.weekStart}`);
  if (rule.count !== undefined) parts.push(`COUNT=${rule.count}`);
  else if (rule.until) parts.push(`UNTIL=${untilText(rule.until)}`);
  return parts.join(";");
}

/**
 * The days of one month a rule picks, as day-of-month numbers.
 *
 * @param {number} year
 * @param {number} month
 * @param {RecurrenceWeekday[] | undefined} byDay
 * @param {number[] | undefined} byMonthDay
 * @param {number} fallbackDay used when the rule names no day
 * @returns {number[]}
 */
function monthDays(year, month, byDay, byMonthDay, fallbackDay) {
  const length = daysInMonth(year, month);
  /** @type {Set<number>} */
  const days = new Set();
  if (byDay?.length) {
    const first = weekdayOf(dayNumber(year, month, 1));
    for (const { day, nth } of byDay) {
      const weekday = WEEKDAYS.indexOf(day);
      const firstMatch = 1 + ((weekday - first + 7) % 7);
      /** @type {number[]} */
      const matches = [];
      for (let d = firstMatch; d <= length; d += 7) matches.push(d);
      if (nth === undefined) {
        for (const d of matches) days.add(d);
      } else {
        const picked =
          nth > 0 ? matches[nth - 1] : matches[matches.length + nth];
        if (picked !== undefined) days.add(picked);
      }
    }
  } else {
    for (const value of byMonthDay?.length ? byMonthDay : [fallbackDay]) {
      const day = value < 0 ? length + 1 + value : value;
      // A month without that day, such as the 31st of April, has no date.
      if (day >= 1 && day <= length) days.add(day);
    }
  }
  return [...days].sort((a, b) => a - b);
}

/**
 * Every day a rule produces from `start`, ascending and without the end
 * limits. A start that does not fit the rule is not an occurrence.
 *
 * @param {RecurrenceRule} rule
 * @param {CalendarDay} start
 * @returns {Generator<number>} day numbers
 */
function* candidates(rule, start) {
  const startNumber = dayNumber(start.year, start.month, start.day);
  const { interval } = rule;
  let empty = 0;

  if (rule.freq === "DAILY") {
    for (let n = startNumber; ; n += interval) yield n;
  }

  if (rule.freq === "WEEKLY") {
    const weekStart = WEEKDAYS.indexOf(rule.weekStart ?? "MO");
    const weekdays = (
      rule.byDay?.length
        ? rule.byDay.map(({ day }) => WEEKDAYS.indexOf(day))
        : [weekdayOf(startNumber)]
    )
      .map((weekday) => (weekday - weekStart + 7) % 7)
      .sort((a, b) => a - b);
    const weekBegin =
      startNumber - ((weekdayOf(startNumber) - weekStart + 7) % 7);
    for (let week = 0; ; week++) {
      for (const offset of new Set(weekdays)) {
        const n = weekBegin + week * interval * 7 + offset;
        if (n >= startNumber) yield n;
      }
    }
  }

  const monthly = rule.freq === "MONTHLY";
  for (let period = 0; empty < MAX_EMPTY_PERIODS; period++) {
    /** @type {Array<[number, number]>} */
    const months = monthly
      ? (() => {
          const index = start.year * 12 + start.month + period * interval;
          return /** @type {Array<[number, number]>} */ ([
            [Math.floor(index / 12), index % 12],
          ]);
        })()
      : [
          ...(rule.byMonth?.length
            ? rule.byMonth.map((m) => m - 1)
            : [start.month]),
        ]
          .sort((a, b) => a - b)
          .map(
            (month) =>
              /** @type {[number, number]} */ ([
                start.year + period * interval,
                month,
              ]),
          );
    let found = false;
    for (const [year, month] of months) {
      for (const day of monthDays(
        year,
        month,
        rule.byDay,
        rule.byMonthDay,
        start.day,
      )) {
        const n = dayNumber(year, month, day);
        if (n >= startNumber) {
          found = true;
          yield n;
        }
      }
    }
    empty = found ? 0 : empty + 1;
  }
}

/**
 * The calendar days a rule produces, from `start`, honoring `count` and
 * `until`. The first `limit` days on or after `from` are returned.
 *
 * @param {RecurrenceRule} rule
 * @param {CalendarDay} start
 * @param {{ limit?: number; from?: CalendarDay }} [options]
 * @returns {CalendarDay[]}
 */
export function occurrenceDays(rule, start, options = {}) {
  const { limit = 10, from = start } = options;
  const fromNumber = dayNumber(from.year, from.month, from.day);
  const untilNumber = rule.until
    ? dayNumber(
        rule.until.getFullYear(),
        rule.until.getMonth(),
        rule.until.getDate(),
      )
    : Number.POSITIVE_INFINITY;
  /** @type {CalendarDay[]} */
  const days = [];
  let produced = 0;
  for (const n of candidates(rule, start)) {
    if (
      n > untilNumber ||
      (rule.count !== undefined && produced >= rule.count)
    ) {
      break;
    }
    produced++;
    if (n >= fromNumber) {
      days.push(fromDayNumber(n));
      if (days.length >= limit) break;
    }
  }
  return days;
}

/**
 * @param {Date} date
 * @returns {CalendarDay}
 */
export function calendarDayOf(date) {
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
  };
}

/**
 * The dates a rule produces from `start`, as local `Date`s that keep the
 * start's time of day. A time the clock skips that day, such as 2:30 on the
 * spring-forward date, becomes the next valid time on that day only; the
 * following occurrences are back at 2:30.
 *
 * @param {RecurrenceRule} rule
 * @param {Date} start the first possible occurrence, and the time of day
 * @param {{ limit?: number; from?: Date }} [options] `limit` defaults to 10
 * @returns {Date[]}
 */
export function occurrences(rule, start, options = {}) {
  const days = occurrenceDays(rule, calendarDayOf(start), {
    limit: options.limit,
    from: options.from ? calendarDayOf(options.from) : undefined,
  });
  return days.map(
    ({ year, month, day }) =>
      new Date(
        year,
        month,
        day,
        start.getHours(),
        start.getMinutes(),
        start.getSeconds(),
        start.getMilliseconds(),
      ),
  );
}

/**
 * The monthly patterns a start date offers: its day of the month, its
 * weekday by position, that weekday as the last one when it is, and the last
 * day of the month.
 *
 * @param {CalendarDay} start
 * @returns {Array<{ id: "day" | "nth" | "lastWeekday" | "lastDay"; byMonthDay?: number[]; byDay?: RecurrenceWeekday[] }>}
 */
export function monthlyChoices(start) {
  const number = dayNumber(start.year, start.month, start.day);
  const day = WEEKDAYS[weekdayOf(number)];
  const nth = Math.ceil(start.day / 7);
  const isLast = start.day + 7 > daysInMonth(start.year, start.month);
  /** @type {ReturnType<typeof monthlyChoices>} */
  const choices = [
    { id: "day", byMonthDay: [start.day] },
    { id: "nth", byDay: [{ day, nth }] },
  ];
  if (isLast) choices.push({ id: "lastWeekday", byDay: [{ day, nth: -1 }] });
  choices.push({ id: "lastDay", byMonthDay: [-1] });
  return choices;
}

/**
 * The position of a start date's weekday in its month, such as `3` for the
 * third Tuesday, and whether it is also the last.
 *
 * @param {CalendarDay} start
 */
export function weekdayPosition(start) {
  return {
    nth: Math.ceil(start.day / 7),
    isLast: start.day + 7 > daysInMonth(start.year, start.month),
  };
}
