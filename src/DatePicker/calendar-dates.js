// @ts-check
import { getDateTimeFormatter } from "../utils/intl-formatter-cache.js";
import { resolveWeekInfo } from "./week-info.js";

/**
 * @typedef {{
 *   weekdays: { shorthand: string[]; longhand: string[] };
 *   months: { shorthand: string[]; longhand: string[] };
 *   firstDayOfWeek: number;
 *   rangeSeparator: string;
 *   ordinal?: (day: number) => string;
 *   weekAbbreviation?: string;
 *   yearAriaLabel?: string;
 *   hourAriaLabel?: string;
 *   minuteAriaLabel?: string;
 *   secondAriaLabel?: string;
 *   periodAriaLabel?: string;
 *   amPM?: [string, string];
 * }} CalendarLocale
 */

const DAY_MS = 86_400_000;

/**
 * Carbon-styled English: single-letter weekday abbreviations, with "Th"
 * disambiguating Thursday from Tuesday.
 *
 * @type {CalendarLocale}
 */
const CARBON_ENGLISH = {
  weekdays: {
    shorthand: ["S", "M", "T", "W", "Th", "F", "S"],
    longhand: [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
  },
  months: {
    shorthand: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    longhand: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
  },
  firstDayOfWeek: 0,
  rangeSeparator: " to ",
  ordinal: (day) => {
    const mod = day % 100;
    if (mod > 3 && mod < 21) return "th";
    return ["th", "st", "nd", "rd"][day % 10] ?? "th";
  },
};

/** @type {Map<string, CalendarLocale>} */
const localeCache = new Map();

/**
 * @param {string} locale
 * @param {Intl.DateTimeFormatOptions} options
 * @param {(index: number) => Date} dateAt
 * @param {number} length
 */
function names(locale, options, dateAt, length) {
  const formatter = getDateTimeFormatter(locale, options);
  return Array.from({ length }, (_, i) => formatter.format(dateAt(i)));
}

const TRAILING_PERIOD = /\.$/;

/**
 * Weekday headings: one letter when that tells the days apart (日 月 火),
 * else the short name without a trailing period, since German "M D M D"
 * names two days each.
 *
 * @param {string} locale
 * @param {(index: number) => Date} dateAt
 */
function weekdayShorthand(locale, dateAt) {
  const narrow = names(locale, { weekday: "narrow" }, dateAt, 7);
  if (new Set(narrow).size === 7) return narrow;
  return names(locale, { weekday: "short" }, dateAt, 7).map((name) =>
    name.replace(TRAILING_PERIOD, ""),
  );
}

/**
 * The locale's AM and PM names ("午前", "午後"), read from a 12-hour
 * format of 01:00 and 13:00.
 *
 * @param {string} locale
 * @returns {[string, string] | undefined}
 */
function dayPeriodNames(locale) {
  const formatter = getDateTimeFormatter(locale, {
    hour: "numeric",
    hour12: true,
  });
  /** @param {number} hour */
  const period = (hour) =>
    formatter
      .formatToParts(new Date(2000, 0, 1, hour))
      .find((part) => part.type === "dayPeriod")?.value;
  const am = period(1);
  const pm = period(13);
  return am && pm ? [am, pm] : undefined;
}

/**
 * @param {string} locale BCP 47 language tag
 * @returns {CalendarLocale}
 */
function buildIntlLocale(locale) {
  const cached = localeCache.get(locale);
  if (cached) return cached;

  let resolved = locale;
  try {
    resolved = Intl.DateTimeFormat.supportedLocalesOf(locale)[0] ?? "en";
  } catch {
    resolved = "en";
  }
  // The grid is Gregorian, but some locales default to another calendar
  // (Persian for `fa`, Islamic for `ar-SA`), which would name the wrong
  // months. Pin the names to the Gregorian calendar.
  const gregorian = new Intl.Locale(resolved, {
    calendar: "gregory",
  }).toString();

  /** @param {number} i */
  const month = (i) => new Date(2000, i, 1);
  // 2000-01-02 is a Sunday.
  /** @param {number} i */
  const weekday = (i) => new Date(2000, 0, 2 + i);
  const built = {
    weekdays: {
      shorthand: weekdayShorthand(gregorian, weekday),
      longhand: names(gregorian, { weekday: "long" }, weekday, 7),
    },
    months: {
      shorthand: names(gregorian, { month: "short" }, month, 12),
      longhand: names(gregorian, { month: "long" }, month, 12),
    },
    firstDayOfWeek: resolveWeekInfo(resolved).firstDay,
    rangeSeparator: CARBON_ENGLISH.rangeSeparator,
    amPM: dayPeriodNames(gregorian),
  };
  localeCache.set(locale, built);
  return built;
}

/**
 * A locale key such as `"de"`, resolved through `Intl`, or a partial
 * locale object merged over Carbon's English.
 *
 * @param {unknown} locale
 * @returns {CalendarLocale}
 */
export function getCalendarLocale(locale) {
  if (locale && typeof locale === "object") {
    const custom = /** @type {Partial<CalendarLocale>} */ (locale);
    return {
      ...CARBON_ENGLISH,
      ...custom,
      weekdays: { ...CARBON_ENGLISH.weekdays, ...custom.weekdays },
      months: { ...CARBON_ENGLISH.months, ...custom.months },
    };
  }
  if (typeof locale !== "string" || locale === "en" || locale === "default") {
    return CARBON_ENGLISH;
  }
  return buildIntlLocale(locale);
}

/**
 * ISO 8601 week number.
 *
 * @param {Date} givenDate
 */
export function isoWeek(givenDate) {
  const date = new Date(givenDate.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((date.getTime() - week1.getTime()) / DAY_MS -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7,
    )
  );
}

/** @param {number} value @param {number} [length] */
function pad(value, length = 2) {
  return String(value).padStart(length, "0");
}

/**
 * @typedef {{ getWeek?: (date: Date) => number }} FormatContext
 */

/** @type {Record<string, (date: Date, l10n: CalendarLocale, context: FormatContext) => string | number>} */
const FORMATTERS = {
  Z: (date) => date.toISOString(),
  // Time tokens: the calendar picks dates only, so these read midnight unless
  // a value carries a time, as with flatpickr when its time picker is off.
  G: (date) => pad(date.getHours() % 12 || 12),
  H: (date) => pad(date.getHours()),
  K: (date, l10n) => dayPeriods(l10n)[date.getHours() > 11 ? 1 : 0],
  S: (date) => pad(date.getSeconds()),
  h: (date) => date.getHours() % 12 || 12,
  i: (date) => pad(date.getMinutes()),
  s: (date) => date.getSeconds(),
  D: (date, l10n) => l10n.weekdays.shorthand[date.getDay()],
  F: (date, l10n) => l10n.months.longhand[date.getMonth()],
  J: (date, l10n) =>
    l10n.ordinal
      ? date.getDate() + l10n.ordinal(date.getDate())
      : date.getDate(),
  M: (date, l10n) => l10n.months.shorthand[date.getMonth()],
  U: (date) => date.getTime() / 1000,
  W: (date, _, context) => (context.getWeek ?? isoWeek)(date),
  Q: (date) => Math.floor(date.getMonth() / 3) + 1,
  Y: (date) => pad(date.getFullYear(), 4),
  d: (date) => pad(date.getDate()),
  j: (date) => date.getDate(),
  l: (date, l10n) => l10n.weekdays.longhand[date.getDay()],
  m: (date) => pad(date.getMonth() + 1),
  n: (date) => date.getMonth() + 1,
  u: (date) => date.getTime(),
  w: (date) => date.getDay(),
  y: (date) => String(date.getFullYear()).slice(2),
};

/**
 * Formats with flatpickr's date tokens. A backslash escapes the next
 * character.
 *
 * @param {Date} date
 * @param {string} format
 * @param {CalendarLocale} l10n
 * @param {FormatContext} [context]
 */
export function formatDate(date, format, l10n, context = {}) {
  let out = "";
  for (let i = 0; i < format.length; i++) {
    const char = format[i];
    if (char === "\\") {
      out += format[++i] ?? "";
    } else {
      const formatter = FORMATTERS[char];
      out += formatter ? formatter(date, l10n, context) : char;
    }
  }
  return out;
}

const ENGLISH = /^en(-|$)/i;
const ZONED = /Z$|GMT$/;
const NUMBER = "(\\d\\d|\\d)";

/** @param {CalendarLocale} l10n */
function dayPeriods(l10n) {
  return l10n.amPM ?? ["AM", "PM"];
}

/** @type {Record<string, (l10n: CalendarLocale) => string>} */
const TOKEN_PATTERNS = {
  D: (l10n) => `(${l10n.weekdays.shorthand.join("|")})`,
  F: (l10n) => `(${l10n.months.longhand.join("|")})`,
  G: () => NUMBER,
  H: () => NUMBER,
  S: () => NUMBER,
  h: () => NUMBER,
  i: () => NUMBER,
  s: () => NUMBER,
  J: () => `${NUMBER}\\w+`,
  K: (l10n) => {
    const [am, pm] = dayPeriods(l10n);
    return `(${am}|${pm}|${am.toLowerCase()}|${pm.toLowerCase()})`;
  },
  M: (l10n) => `(${l10n.months.shorthand.join("|")})`,
  U: () => "(.+)",
  W: () => NUMBER,
  Q: () => "([1-4])",
  Y: () => "(\\d{4})",
  Z: () => "(.+)",
  d: () => NUMBER,
  j: () => NUMBER,
  l: (l10n) => `(${l10n.weekdays.longhand.join("|")})`,
  m: () => NUMBER,
  n: () => NUMBER,
  u: () => "(.+)",
  w: () => NUMBER,
  y: () => "(\\d{2})",
};

/** @type {Record<string, (date: Date, value: string, l10n: CalendarLocale) => Date | void>} */
const REVERSE = {
  G: (date, value) => {
    date.setHours((date.getHours() >= 12 ? 12 : 0) + Number.parseFloat(value));
  },
  H: (date, value) => {
    date.setHours(Number.parseFloat(value));
  },
  S: (date, value) => {
    date.setSeconds(Number.parseFloat(value));
  },
  h: (date, value) => {
    date.setHours((date.getHours() >= 12 ? 12 : 0) + Number.parseFloat(value));
  },
  i: (date, value) => {
    date.setMinutes(Number.parseFloat(value));
  },
  s: (date, value) => {
    date.setSeconds(Number.parseFloat(value));
  },
  F: (date, value, l10n) => {
    date.setMonth(l10n.months.longhand.indexOf(value));
  },
  J: (date, value) => {
    date.setDate(Number.parseFloat(value));
  },
  K: (date, value, l10n) => {
    const pm = value.toLowerCase() === dayPeriods(l10n)[1].toLowerCase();
    date.setHours((date.getHours() % 12) + (pm ? 12 : 0));
  },
  M: (date, value, l10n) => {
    date.setMonth(l10n.months.shorthand.indexOf(value));
  },
  U: (_, value) => new Date(Number.parseFloat(value) * 1000),
  W: (date, value, l10n) => {
    const week = new Date(
      date.getFullYear(),
      0,
      2 + (Number.parseInt(value, 10) - 1) * 7,
    );
    week.setDate(week.getDate() - week.getDay() + l10n.firstDayOfWeek);
    return week;
  },
  Q: (date, value) => {
    date.setMonth((Number.parseFloat(value) - 1) * 3, 1);
  },
  Y: (date, value) => {
    date.setFullYear(Number.parseFloat(value));
  },
  Z: (_, value) => new Date(value),
  d: (date, value) => {
    date.setDate(Number.parseFloat(value));
  },
  j: (date, value) => {
    date.setDate(Number.parseFloat(value));
  },
  m: (date, value) => {
    date.setMonth(Number.parseFloat(value) - 1);
  },
  n: (date, value) => {
    date.setMonth(Number.parseFloat(value) - 1);
  },
  u: (_, value) => new Date(Number.parseFloat(value)),
  y: (date, value) => {
    date.setFullYear(2000 + Number.parseFloat(value));
  },
};

/**
 * @typedef {{
 *   l10n: CalendarLocale;
 *   dateFormat: string;
 *   parseDate?: (value: string, format: string) => Date | undefined;
 *   onError: (error: Error) => void;
 * }} ParseContext
 */

/**
 * Parses a date, string, or timestamp. A string is matched against
 * `format` token by token, so it is as lenient as flatpickr's parser: an
 * overflowing day rolls into the next month instead of failing. `"today"`
 * is accepted. Reports and returns `undefined` for anything unparseable.
 *
 * @param {unknown} value
 * @param {ParseContext} context
 * @param {string} [givenFormat]
 * @param {boolean} [timeless] zero the time of day
 * @returns {Date | undefined}
 */
export function parseDate(value, context, givenFormat, timeless = false) {
  if (value !== 0 && !value) return undefined;
  const { l10n } = context;
  /** @type {Date | undefined} */
  let parsed;
  let zeroTime = timeless;

  if (value instanceof Date) {
    parsed = new Date(value.getTime());
  } else if (typeof value === "number") {
    parsed = new Date(value);
  } else if (typeof value === "string") {
    const format = givenFormat || context.dateFormat;
    const text = value.trim();
    if (text === "today") {
      parsed = new Date();
      zeroTime = true;
    } else if (context.parseDate) {
      parsed = context.parseDate(value, format);
    } else if (ZONED.test(text)) {
      parsed = new Date(value);
    } else {
      /** @type {Array<{ token: string; value: string }>} */
      const ops = [];
      let pattern = "";
      let matched = false;
      let matchIndex = 0;
      for (let i = 0; i < format.length; i++) {
        const token = format[i];
        const isBackslash = token === "\\";
        const escaped = format[i - 1] === "\\" || isBackslash;
        if (TOKEN_PATTERNS[token] && !escaped) {
          pattern += TOKEN_PATTERNS[token](l10n);
          const match = new RegExp(pattern).exec(value);
          if (match) {
            matched = true;
            // The year goes first so a later month/day setter is not undone
            // by a leap-year rollover.
            ops[token === "Y" ? "unshift" : "push"]({
              token,
              value: match[++matchIndex],
            });
          }
        } else if (!isBackslash) {
          pattern += ".";
        }
      }
      // AM/PM shifts the hour, so it applies after `h` or `G` wherever it
      // sits in the format.
      ops.sort((a, b) => Number(a.token === "K") - Number(b.token === "K"));
      let date = new Date(new Date().getFullYear(), 0, 1);
      for (const op of ops) {
        date =
          /** @type {Date} */ (REVERSE[op.token]?.(date, op.value, l10n)) ||
          date;
      }
      parsed = matched ? date : undefined;
    }
  }

  if (!(parsed instanceof Date) || Number.isNaN(parsed.getTime())) {
    context.onError(new Error(`Invalid date provided: ${value}`));
    return undefined;
  }
  if (zeroTime) parsed.setHours(0, 0, 0, 0);
  return parsed;
}

/**
 * Day ordering ignoring time of day: negative, zero, or positive as `a` is
 * before, the same as, or after `b`. The magnitude is not a day count.
 *
 * @param {Date} a
 * @param {Date} b
 */
export function compareDays(a, b) {
  return (
    a.getFullYear() * 10_000 +
    a.getMonth() * 100 +
    a.getDate() -
    (b.getFullYear() * 10_000 + b.getMonth() * 100 + b.getDate())
  );
}

/** @param {number} year @param {number} month */
export function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export { DAY_MS };

/**
 * Formats a year and month in `locale` with the Gregorian calendar, like the
 * grid: Persian dates put the year first, but the Gregorian dates `fa`
 * shows put the month first. `undefined` for English, which every caller
 * handles without `Intl` (its cold start costs a few ms on first mount).
 *
 * @param {unknown} locale
 * @returns {Intl.DateTimeFormat | undefined}
 */
function yearMonthFormatter(locale) {
  if (typeof locale !== "string" || ENGLISH.test(locale)) return undefined;
  try {
    const gregorian = new Intl.Locale(locale, {
      calendar: "gregory",
    }).toString();
    return getDateTimeFormatter(gregorian, {
      year: "numeric",
      month: "long",
    });
  } catch {
    return undefined;
  }
}

/**
 * @param {unknown} locale
 * @returns {Intl.DateTimeFormatPart[] | undefined}
 */
function yearMonthParts(locale) {
  return yearMonthFormatter(locale)?.formatToParts(new Date(2000, 0, 1));
}

/**
 * The month and year of `date` in `locale`'s order and words: "March
 * 2024", "2024年3月", "2024년 3월". The year keeps Latin digits, like the
 * grid. English and locale objects write `monthNames` then the year.
 *
 * @param {Date} date
 * @param {unknown} locale
 * @param {readonly string[]} monthNames
 */
export function formatMonthYear(date, locale, monthNames) {
  const year = String(date.getFullYear());
  const formatter = yearMonthFormatter(locale);
  if (!formatter) return `${monthNames[date.getMonth()]} ${year}`;
  return formatter
    .formatToParts(date)
    .map((part) => (part.type === "year" ? year : part.value))
    .join("");
}

/** @param {Intl.DateTimeFormatPart[]} parts */
const yearAndMonth = (parts) => [
  parts.findIndex((part) => part.type === "year"),
  parts.findIndex((part) => part.type === "month"),
];

/**
 * Whether `locale` orders the month before the year ("January 2000") as
 * opposed to year before month ("2000年1月").
 *
 * @param {unknown} locale
 */
export function isMonthFirst(locale) {
  const parts = yearMonthParts(locale);
  if (!parts) return true;
  const [year, month] = yearAndMonth(parts);
  return month < year;
}

/**
 * What a year-first locale writes between the year and the month: "年" in
 * "2000年1月", "년" in Korean. Empty for month-first locales.
 *
 * @param {unknown} locale
 */
export function yearSuffix(locale) {
  const parts = yearMonthParts(locale);
  if (!parts) return "";
  const [year, month] = yearAndMonth(parts);
  if (year === -1 || month < year) return "";
  return parts
    .slice(year + 1, month)
    .map((part) => part.value)
    .join("")
    .trim();
}
