// @ts-check
// What RecurrencePicker says. The sentence shapes are English; names, dates,
// lists and numbers come from `Intl`, so they follow `locale` on their own.
import {
  getDateTimeFormatter,
  getNumberFormatter,
} from "../utils/intl-formatter-cache.js";
import { WEEKDAYS } from "../utils/recurrence.js";

/**
 * @typedef {import("../utils/recurrence.js").RecurrenceRule} RecurrenceRule
 * @typedef {import("../utils/recurrence.js").Weekday} Weekday
 */

/**
 * Names for a locale. Every date is built in UTC and written in UTC, so a
 * server and a browser in different time zones write the same text.
 *
 * @typedef {object} RecurrenceFormat
 * @property {(day: Weekday, width?: "long" | "short") => string} weekday
 * @property {(month: number, width?: "long" | "short") => string} month 0-based
 * @property {(items: string[]) => string} list "Tuesday and Thursday"
 * @property {(year: number, month: number, day: number) => string} date "Dec 31, 2026"
 * @property {(year: number, month: number, day: number) => string} fullDate "Tue, Nov 3, 2026"
 * @property {(unit: "day" | "week" | "month" | "year", count: number) => string} unit "weeks" or "week"
 */

/**
 * @param {string} locale
 * @returns {RecurrenceFormat}
 */
export function createFormat(locale) {
  /** @param {Intl.DateTimeFormatOptions} options */
  const write = (options) =>
    getDateTimeFormatter(locale, { ...options, timeZone: "UTC" });
  return {
    weekday(day, width = "long") {
      // 2023-01-01 was a Sunday.
      const date = new Date(Date.UTC(2023, 0, 1 + WEEKDAYS.indexOf(day)));
      return write({ weekday: width }).format(date);
    },
    month(month, width = "long") {
      return write({ month: width }).format(new Date(Date.UTC(2000, month, 1)));
    },
    list(items) {
      const List = /** @type {any} */ (Intl).ListFormat;
      return typeof List === "function"
        ? new List(locale, { type: "conjunction", style: "long" }).format(items)
        : items.join(", ");
    },
    date(year, month, day) {
      return write({ dateStyle: "medium" }).format(
        new Date(Date.UTC(year, month, day)),
      );
    },
    fullDate(year, month, day) {
      return write({
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(Date.UTC(year, month, day)));
    },
    unit(unit, count) {
      return getNumberFormatter(locale, {
        style: "unit",
        unit,
        unitDisplay: "long",
      })
        .formatToParts(count)
        .filter((part) => part.type === "unit")
        .map((part) => part.value)
        .join("")
        .trim();
    },
  };
}

const ORDINALS = ["", "first", "second", "third", "fourth", "fifth"];

/** @param {number} nth */
const ordinal = (nth) => (nth === -1 ? "last" : ORDINALS[nth]);

/**
 * Every string the picker shows, in English. Pass any of them in `text` to
 * change it.
 *
 * @typedef {object} RecurrencePickerText
 * @property {string} frequency Label of the frequency select
 * @property {string} doesNotRepeat
 * @property {string} daily
 * @property {string} weekly
 * @property {string} monthly
 * @property {string} yearly
 * @property {string} interval Label of the interval field, before the unit
 * @property {string} weekdays Legend of the weekday buttons
 * @property {string} monthlyPattern Label of the monthly pattern select
 * @property {string} ends Label of the end select
 * @property {string} never
 * @property {string} afterCount
 * @property {string} onDate
 * @property {string} count Label of the occurrence count field
 * @property {string} until Label of the end date field
 * @property {string} preview Heading of the list of next dates
 * @property {string} custom Shown for a rule the picker cannot edit
 * @property {(day: number) => string} monthDay "On day 15"
 * @property {(nth: number, weekday: string) => string} monthNth "On the third Tuesday"; `nth` is `-1` for the last
 * @property {string} monthLastDay
 */

/** @type {RecurrencePickerText} */
export const DEFAULT_TEXT = {
  frequency: "Repeat",
  doesNotRepeat: "Does not repeat",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
  interval: "Repeat every",
  weekdays: "Repeat on",
  monthlyPattern: "Monthly pattern",
  ends: "Ends",
  never: "Never",
  afterCount: "After a number of times",
  onDate: "On a date",
  count: "Number of times",
  until: "End date",
  preview: "Next occurrences",
  custom:
    "This rule has options the picker cannot edit. Choose a frequency to replace it.",
  monthDay: (day) => `On day ${day}`,
  monthNth: (nth, weekday) => `On the ${ordinal(nth)} ${weekday}`,
  monthLastDay: "On the last day of the month",
};

/**
 * What a summary builder gets besides the rule.
 *
 * @typedef {object} RecurrenceSummaryContext
 * @property {string} locale
 * @property {Date} startDate
 * @property {RecurrenceFormat} format
 */

/**
 * "Every 2 weeks on Tuesday and Thursday, until Dec 31, 2026". The shape of
 * the sentence is English. Replace it with `summaryText` for another
 * language, and use `context.format` for names, dates and lists.
 *
 * @param {RecurrenceRule} rule
 * @param {RecurrenceSummaryContext} context
 * @returns {string}
 */
export function defaultSummary(rule, context) {
  const { format, startDate } = context;
  const unit = /** @type {const} */ ({
    DAILY: "day",
    WEEKLY: "week",
    MONTHLY: "month",
    YEARLY: "year",
  })[rule.freq];
  const every =
    rule.interval === 1
      ? `Every ${format.unit(unit, 1)}`
      : `Every ${rule.interval} ${format.unit(unit, rule.interval)}`;

  let where = "";
  if (rule.freq === "WEEKLY") {
    const days = (rule.byDay ?? [{ day: WEEKDAYS[startDate.getDay()] }]).map(
      ({ day }) => day,
    );
    if (days.length === 7 && rule.interval === 1) {
      return withEnd("Every day", rule, format);
    }
    where = ` on ${format.list(days.map((day) => format.weekday(day)))}`;
  } else if (rule.freq === "MONTHLY") {
    where = ` ${monthlyWhere(rule, startDate, format)}`;
  } else if (rule.freq === "YEARLY") {
    const month = rule.byMonth?.[0] ?? startDate.getMonth() + 1;
    const day = rule.byMonthDay?.[0] ?? startDate.getDate();
    where = ` on ${format.month(month - 1)} ${day}`;
  }
  return withEnd(`${every}${where}`, rule, format);
}

/**
 * @param {RecurrenceRule} rule
 * @param {Date} startDate
 * @param {RecurrenceFormat} format
 */
function monthlyWhere(rule, startDate, format) {
  if (rule.byDay?.length) {
    const phrases = rule.byDay.map(({ day, nth }) =>
      nth === undefined
        ? format.weekday(day)
        : `the ${ordinal(nth)} ${format.weekday(day)}`,
    );
    return `on ${format.list(phrases)}`;
  }
  const days = rule.byMonthDay ?? [startDate.getDate()];
  const phrases = days.map((day) =>
    day === -1 ? "the last day" : `day ${day}`,
  );
  return `on ${format.list(phrases)}`;
}

/**
 * @param {string} sentence
 * @param {RecurrenceRule} rule
 * @param {RecurrenceFormat} format
 */
function withEnd(sentence, rule, format) {
  if (rule.count !== undefined) {
    return `${sentence}, ${rule.count} ${rule.count === 1 ? "time" : "times"}`;
  }
  if (rule.until) {
    const { until } = rule;
    return `${sentence}, until ${format.date(until.getFullYear(), until.getMonth(), until.getDate())}`;
  }
  return sentence;
}
