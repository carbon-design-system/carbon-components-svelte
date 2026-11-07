// @ts-check
// A small parser for dates typed as people say them: "next Fri 3pm",
// "in 2 weeks", "Dec 3", "3/12", "end of month", "eod".
//
// It is pure: text in, a result out, no clock, no DOM and no throwing. The
// instant `now`, the time zone and the locale come in as options. It reads
// no regular expression built from the text, runs no `eval`, and every loop
// moves forward through at most `MAX_TOKENS` tokens, so a hostile string
// costs about as much as a short one.
import { resolveWeekInfo } from "../DatePicker/week-info.js";
import { BoundedFifoCache } from "../utils/bounded-fifo-cache.js";
import { getDateTimeFormatter } from "../utils/intl-formatter-cache.js";

/**
 * One word of a language pack: a tag and, for some tags, a value.
 *
 * | Tag | Value | Reads as |
 * | --- | --- | --- |
 * | `fill` | | Skipped: "on", "by", "the", "due" |
 * | `at` | | Skipped, and lets a bare hour be a time: "at 3" |
 * | `day` | days from today | "today" 0, "tomorrow" 1, "yesterday" -1 |
 * | `now` | | "now" |
 * | `mod` | -1, 0 or 1 | "last", "this", "next" |
 * | `in` | | "in 2 days" |
 * | `ago` | | "2 days ago", before or after the amount |
 * | `later` | | "2 days later" |
 * | `from` | | "2 days from now", with `now` after it |
 * | `num` | the number | "a", "an", "two" |
 * | `unit` | `m` `h` `d` `w` `M` `y` | "minutes", "hours", "days", "weeks", "months", "years" |
 * | `ordinal` | | Skipped after a day number: "3rd" |
 * | `mer` | `am` or `pm` | "am", "pm" |
 * | `time` | `[hour, minute]` | "noon", "midnight" |
 * | `eod` | | "eod", the configured end of the day |
 * | `end` | | "end of month" |
 * | `eow` `eom` `eoy` | | "eow", "eom", "eoy" |
 *
 * Month and weekday names are not listed: they come from `Intl` for the
 * locale, and for the pack's own `locale`.
 *
 * @typedef {object} NaturalDatePack
 * @property {string} id
 * @property {string} locale - Language whose month and weekday names are read as well as the locale's.
 * @property {Record<string, [tag: string, value?: number | string | [number, number]]>} words
 */

/**
 * @typedef {"future" | "past" | "nearest"} NaturalDatePrefer
 */

/**
 * @typedef {object} NaturalDateOptions
 * @property {Date | number | string} [now] - The instant "now" stands for. Default: the clock.
 * @property {string} [timeZone] - IANA name. Default `"UTC"`.
 * @property {string} [locale] - Sets the order of "3/12", and the names of months and days. Default `"en"`.
 * @property {number} [weekStart] - First day of the week, 0 (Sunday) to 6. Default: the locale's.
 * @property {NaturalDatePrefer} [prefer] - Which way a date with no year, or a bare time, rolls. Default `"future"`.
 * @property {string | [number, number]} [eod] - "eod" as `"17:00"`. Default `"17:00"`.
 * @property {[first: number, last: number]} [workWeek] - First and last working day, 0 to 6. Default `[1, 5]`.
 * @property {NaturalDatePack} [pack] - Words of another language. Default English.
 */

/**
 * @typedef {object} NaturalDateParsed
 * @property {true} ok
 * @property {Date} date - The instant. A date with no time is its first moment in the zone.
 * @property {number} year - The date on the zone's calendar.
 * @property {number} month - 1 to 12.
 * @property {number} day
 * @property {number} hour
 * @property {number} minute
 * @property {boolean} hasTime - `true` when the text named a time.
 * @property {boolean} ambiguous - `true` for "3/12": both orders are dates. `date` is the locale's.
 * @property {Date | null} alternative - The other reading of an ambiguous date.
 * @property {boolean} swapped - `true` when the locale's order was impossible ("25/12" in the US) and the other was read.
 */

/**
 * @typedef {"empty" | "unrecognized" | "invalid-date" | "invalid-time" | "out-of-range" | "too-long"} NaturalDateFailure
 */

/**
 * @typedef {object} NaturalDateFailed
 * @property {false} ok
 * @property {NaturalDateFailure} reason
 * @property {number} index - Where in the text the reading stopped.
 */

/** The most text the parser reads. */
export const NATURAL_DATE_MAX_LENGTH = 128;

const MAX_TOKENS = 24;
const MAX_DIGITS = 8;
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const MIN_YEAR = 1000;
const MAX_YEAR = 9999;

/** @type {NaturalDatePack} */
export const NATURAL_DATE_EN = {
  id: "en",
  locale: "en",
  words: {
    on: ["fill"],
    by: ["fill"],
    for: ["fill"],
    the: ["fill"],
    due: ["fill"],
    of: ["fill"],
    at: ["at"],
    today: ["day", 0],
    tomorrow: ["day", 1],
    tmrw: ["day", 1],
    tmr: ["day", 1],
    yesterday: ["day", -1],
    now: ["now"],
    next: ["mod", 1],
    this: ["mod", 0],
    last: ["mod", -1],
    previous: ["mod", -1],
    prev: ["mod", -1],
    in: ["in"],
    ago: ["ago"],
    later: ["later"],
    from: ["from"],
    a: ["num", 1],
    an: ["num", 1],
    one: ["num", 1],
    two: ["num", 2],
    three: ["num", 3],
    four: ["num", 4],
    five: ["num", 5],
    six: ["num", 6],
    seven: ["num", 7],
    eight: ["num", 8],
    nine: ["num", 9],
    ten: ["num", 10],
    eleven: ["num", 11],
    twelve: ["num", 12],
    minute: ["unit", "m"],
    minutes: ["unit", "m"],
    min: ["unit", "m"],
    mins: ["unit", "m"],
    hour: ["unit", "h"],
    hours: ["unit", "h"],
    hr: ["unit", "h"],
    hrs: ["unit", "h"],
    h: ["unit", "h"],
    day: ["unit", "d"],
    days: ["unit", "d"],
    d: ["unit", "d"],
    week: ["unit", "w"],
    weeks: ["unit", "w"],
    wk: ["unit", "w"],
    wks: ["unit", "w"],
    w: ["unit", "w"],
    month: ["unit", "M"],
    months: ["unit", "M"],
    year: ["unit", "y"],
    years: ["unit", "y"],
    yr: ["unit", "y"],
    yrs: ["unit", "y"],
    y: ["unit", "y"],
    st: ["ordinal"],
    nd: ["ordinal"],
    rd: ["ordinal"],
    th: ["ordinal"],
    am: ["mer", "am"],
    pm: ["mer", "pm"],
    noon: ["time", [12, 0]],
    midday: ["time", [12, 0]],
    midnight: ["time", [0, 0]],
    eod: ["eod"],
    eow: ["eow"],
    eom: ["eom"],
    eoy: ["eoy"],
    end: ["end"],
    tues: ["weekday", 2],
    weds: ["weekday", 3],
    thur: ["weekday", 4],
    thurs: ["weekday", 4],
    sept: ["month", 9],
  },
};

// ---------------------------------------------------------------------------
// Time zones. Copied from the time range engine, which is not on master.
// ---------------------------------------------------------------------------

/**
 * @param {number} year
 * @param {number} month - 1 to 12
 * @param {number} day
 * @param {number} [hour]
 * @param {number} [minute]
 * @returns {number} UTC milliseconds, for any year (`Date.UTC` maps 0 to 99 onto 1900s).
 */
function utc(year, month, day, hour = 0, minute = 0) {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, 0, 0);
  return date.getTime();
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
  });
}

/**
 * The wall clock in `timeZone` at the instant `time`.
 *
 * @param {number} time
 * @param {string} timeZone
 */
function wallTime(time, timeZone) {
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
  };
}

/**
 * @param {number} time
 * @param {string} timeZone
 */
function offsetAt(time, timeZone) {
  const w = wallTime(time, timeZone);
  const floored = time - (((time % MINUTE) + MINUTE) % MINUTE);
  return utc(w.year, w.month, w.day, w.hour, w.minute) - floored;
}

/**
 * The instant at which the wall clock in `timeZone` reads the given time. A
 * time that happens twice (clocks go back) is the first one. A time that
 * never happens (clocks go forward) is read with the offset from before the
 * change, so 02:30 lands on 03:30.
 *
 * @param {number} year
 * @param {number} month
 * @param {number} day
 * @param {number} hour
 * @param {number} minute
 * @param {string} timeZone
 * @returns {number}
 */
function instantFromWall(year, month, day, hour, minute, timeZone) {
  const t = utc(year, month, day, hour, minute);
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
// Calendar days. A day is its number of days since 1970-01-01, so the
// arithmetic never meets a time zone.
// ---------------------------------------------------------------------------

/**
 * @param {number} year
 * @param {number} month
 * @param {number} day
 */
function dayNumber(year, month, day) {
  return Math.floor(utc(year, month, day) / DAY);
}

/** @param {number} n */
function fromDayNumber(n) {
  const d = new Date(n * DAY);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  };
}

/** @param {number} n */
function weekdayOf(n) {
  return new Date(n * DAY).getUTCDay();
}

/**
 * @param {number} year
 * @param {number} month
 */
function daysInMonth(year, month) {
  return new Date(utc(year, month + 1, 0)).getUTCDate();
}

/**
 * @param {number} year
 * @param {number} month
 * @param {number} day
 */
function isValidDay(year, month, day) {
  return (
    Number.isInteger(year) &&
    year >= MIN_YEAR &&
    year <= MAX_YEAR &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysInMonth(year, month)
  );
}

/**
 * Add whole months, keeping the day when the month has it and the last day
 * of the month when not (January 31 plus a month is February 28).
 *
 * @param {number} year
 * @param {number} month
 * @param {number} day
 * @param {number} months
 */
function addMonths(year, month, day, months) {
  const total = year * 12 + (month - 1) + months;
  const y = Math.floor(total / 12);
  const m = (((total % 12) + 12) % 12) + 1;
  if (y < MIN_YEAR || y > MAX_YEAR) return null;
  return { year: y, month: m, day: Math.min(day, daysInMonth(y, m)) };
}

// ---------------------------------------------------------------------------
// Locale data
// ---------------------------------------------------------------------------

/** @type {BoundedFifoCache<string, string>} */
const localeCache = new BoundedFifoCache(32);

/**
 * @param {string | undefined} locale
 * @returns {string}
 */
function canonicalLocale(locale) {
  if (typeof locale !== "string" || !locale) return "en";
  const cached = localeCache.get(locale);
  if (cached) return cached;
  let result = "en";
  try {
    result = Intl.getCanonicalLocales(locale)[0] ?? "en";
  } catch {
    // An unknown tag reads as English.
  }
  localeCache.set(locale, result);
  return result;
}

/** @type {BoundedFifoCache<string, boolean>} */
const clockCache = new BoundedFifoCache(32);

/**
 * Whether a locale writes the time on a 12-hour clock.
 *
 * @param {string} locale
 * @returns {boolean}
 */
function usesTwelveHourClock(locale) {
  const tag = canonicalLocale(locale);
  const cached = clockCache.get(tag);
  if (cached !== undefined) return cached;
  let twelve = true;
  try {
    const cycle = getDateTimeFormatter(tag, {
      numberingSystem: "latn",
      hour: "numeric",
    }).resolvedOptions().hourCycle;
    twelve = cycle === "h12" || cycle === "h11";
  } catch {
    // Keep the US clock.
  }
  clockCache.set(tag, twelve);
  return twelve;
}

/** @type {BoundedFifoCache<string, "mdy" | "dmy" | "ymd">} */
const orderCache = new BoundedFifoCache(32);

/**
 * The order a locale writes the day, month and year in: `"mdy"` (en-US),
 * `"dmy"` (en-GB, de, fr) or `"ymd"` (ja, sv, hu). Read from `Intl`, with
 * Latin digits and the Gregorian calendar, so a locale that writes another
 * calendar by default still gives its numeric order.
 *
 * @param {string} locale
 * @returns {"mdy" | "dmy" | "ymd"}
 */
export function naturalDateOrder(locale) {
  const tag = canonicalLocale(locale);
  const cached = orderCache.get(tag);
  if (cached) return cached;
  /** @type {"mdy" | "dmy" | "ymd"} */
  let order = "mdy";
  try {
    const parts = getDateTimeFormatter(tag, {
      timeZone: "UTC",
      calendar: "gregory",
      numberingSystem: "latn",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).formatToParts(Date.UTC(2006, 10, 22));
    const found = parts
      .filter(
        (p) => p.type === "year" || p.type === "month" || p.type === "day",
      )
      .map((p) => p.type[0])
      .join("");
    if (found === "mdy" || found === "dmy" || found === "ymd") order = found;
  } catch {
    // Keep the US order.
  }
  orderCache.set(tag, order);
  return order;
}

/** @param {string} word */
function normalizeWord(word) {
  let out = "";
  for (const ch of word.normalize("NFKC").toLowerCase()) {
    if (ch !== "." && ch !== "'" && ch !== "\u2019") out += ch;
  }
  return out;
}

/**
 * Month and weekday names `Intl` writes for a locale, in the forms a date
 * uses: long and short, on their own and beside a day number (Russian
 * "ноябрь" and "ноября").
 *
 * @param {string} locale
 * @returns {{ months: Set<string>[], weekdays: Set<string>[] }}
 */
function intlNames(locale) {
  /** @type {Set<string>[]} */
  const months = Array.from({ length: 12 }, () => new Set());
  /** @type {Set<string>[]} */
  const weekdays = Array.from({ length: 7 }, () => new Set());
  const base = {
    timeZone: "UTC",
    calendar: "gregory",
    numberingSystem: "latn",
  };
  try {
    for (const width of /** @type {const} */ (["long", "short"])) {
      const alone = getDateTimeFormatter(locale, { ...base, month: width });
      const withDay = getDateTimeFormatter(locale, {
        ...base,
        month: width,
        day: "numeric",
      });
      const weekday = getDateTimeFormatter(locale, { ...base, weekday: width });
      for (let m = 0; m < 12; m++) {
        const time = Date.UTC(2006, m, 15);
        months[m].add(normalizeWord(alone.format(time)));
        for (const part of withDay.formatToParts(time)) {
          if (part.type === "month") months[m].add(normalizeWord(part.value));
        }
      }
      // 2006-01-01 was a Sunday.
      for (let d = 0; d < 7; d++) {
        weekdays[d].add(
          normalizeWord(weekday.format(Date.UTC(2006, 0, 1 + d))),
        );
      }
    }
  } catch {
    // A locale `Intl` does not know has no names of its own.
  }
  return { months, weekdays };
}

/**
 * @typedef {[tag: string, value?: number | string | [number, number]]} LexEntry
 */

/** @type {WeakMap<NaturalDatePack, BoundedFifoCache<string, Map<string, LexEntry>>>} */
const lexiconCache = new WeakMap();

/**
 * Every word the parser knows for a locale and a pack, as the word it is
 * written in lower case, with no dots.
 *
 * @param {string} locale
 * @param {NaturalDatePack} pack
 * @returns {Map<string, LexEntry>}
 */
function lexicon(locale, pack) {
  let perPack = lexiconCache.get(pack);
  if (!perPack) {
    perPack = new BoundedFifoCache(16);
    lexiconCache.set(pack, perPack);
  }
  const cached = perPack.get(locale);
  if (cached) return cached;

  /** @type {Map<string, LexEntry>} */
  const words = new Map();
  for (const [word, entry] of Object.entries(pack.words)) {
    const key = normalizeWord(word);
    if (key && !words.has(key)) words.set(key, entry);
  }
  for (const tag of new Set([locale, canonicalLocale(pack.locale)])) {
    const names = intlNames(tag);
    for (const [i, set] of names.months.entries()) {
      for (const name of set) {
        if (name && !words.has(name)) words.set(name, ["month", i + 1]);
      }
    }
    for (const [i, set] of names.weekdays.entries()) {
      for (const name of set) {
        if (name && !words.has(name)) words.set(name, ["weekday", i]);
      }
    }
  }
  perPack.set(locale, words);
  return words;
}

// ---------------------------------------------------------------------------
// Tokens
// ---------------------------------------------------------------------------

/**
 * @typedef {object} Token
 * @property {"num" | "word" | "sep"} k
 * @property {string} v - Digits, the word, or the separator.
 * @property {number} s - Where it starts in the text.
 * @property {string} [tag] - A word's tag, or `"?"` for a word nobody knows.
 * @property {number | string | [number, number]} [val]
 */

const LETTER = /^[\p{L}\p{M}]$/u;
const SPACE = /^\s$/;
const DASHES = "-\u2010\u2011\u2013\u2014\u2212";

/**
 * @param {string} text
 * @param {Map<string, LexEntry>} words
 * @returns {{ tokens: Token[] } | { bad: number }}
 */
function tokenize(text, words) {
  /** @type {Token[]} */
  const tokens = [];
  const n = text.length;
  let i = 0;
  while (i < n) {
    const ch = text[i];
    if (ch === "," || SPACE.test(ch)) {
      i++;
      continue;
    }
    if (tokens.length >= MAX_TOKENS) return { bad: i };
    if (ch >= "0" && ch <= "9") {
      let j = i + 1;
      while (j < n && text[j] >= "0" && text[j] <= "9") j++;
      if (j - i > MAX_DIGITS) return { bad: i };
      tokens.push({ k: "num", v: text.slice(i, j), s: i });
      // The dot of an ordinal or a date ("3. Dezember", "3.12."), not the
      // separator of "3.12" or "5. 1. 2026", which a digit follows.
      if (text[j] === ".") {
        let k = j + 1;
        while (k < n && SPACE.test(text[k])) k++;
        if (!(text[k] >= "0" && text[k] <= "9")) j++;
      }
      i = j;
    } else if (LETTER.test(ch)) {
      let word = ch;
      let j = i + 1;
      while (j < n) {
        const c = text[j];
        if (LETTER.test(c)) {
          word += c;
          j++;
        } else if (c === "." && j + 1 < n && LETTER.test(text[j + 1])) {
          // "p.m." is one word.
          j++;
        } else {
          break;
        }
      }
      // The dot of an abbreviation: "Dec. 3", "p.m.".
      if (text[j] === ".") j++;
      const v = normalizeWord(word);
      const entry = words.get(v);
      tokens.push({
        k: "word",
        v,
        s: i,
        tag: entry ? entry[0] : "?",
        val: entry ? entry[1] : undefined,
      });
      i = j;
    } else if (ch === "/" || ch === "." || ch === ":") {
      tokens.push({ k: "sep", v: ch, s: i });
      i++;
    } else if (DASHES.includes(ch)) {
      tokens.push({ k: "sep", v: "-", s: i });
      i++;
    } else {
      return { bad: i };
    }
  }
  return { tokens };
}

// ---------------------------------------------------------------------------
// Reading phrases
// ---------------------------------------------------------------------------

/**
 * What the text says about the date, before the clock is read.
 *
 * @typedef {(
 *   | { type: "days", n: number }
 *   | { type: "weekday", wd: number, mode: "bare" | "this" | "next" | "last" }
 *   | { type: "period", unit: "w" | "M" | "y", mod: number }
 *   | { type: "endOf", unit: "w" | "M" | "y", mod: number }
 *   | { type: "shift", n: number, unit: "m" | "h" | "d" | "w" | "M" | "y" }
 *   | { type: "ymd", year: number | null, month: number, day: number, swap: { month: number, day: number } | null }
 *   | { type: "dayOfMonth", day: number }
 *   | { type: "now" }
 * )} DateSpec
 */

/**
 * @typedef {object} TimeSpec
 * @property {number} [h]
 * @property {number} [m]
 * @property {boolean} [eod] - "eod": today, even when it has passed.
 * @property {boolean} [now]
 * @property {boolean} [shift] - Set by an amount of hours or minutes, which also names the date.
 */

/**
 * @typedef {object} Phrase
 * @property {number} used - Tokens read.
 * @property {DateSpec} [date]
 * @property {TimeSpec} [time]
 * @property {NaturalDateFailure} [fail]
 */

/**
 * @param {Token | undefined} t
 * @param {string} tag
 */
const isTag = (t, tag) => t !== undefined && t.k === "word" && t.tag === tag;

/**
 * @param {Token | undefined} t
 * @param {string} v
 */
const isSep = (t, v) => t !== undefined && t.k === "sep" && t.v === v;

/**
 * @param {Token | undefined} t
 * @param {number} [min]
 * @param {number} [max]
 */
const isNum = (t, min = 1, max = MAX_DIGITS) =>
  t !== undefined && t.k === "num" && t.v.length >= min && t.v.length <= max;

/** @param {Token} t */
const numValue = (t) => Number(t.v);

/**
 * An amount: digits or a number word.
 *
 * @param {Token | undefined} t
 * @returns {number | null}
 */
function quantity(t) {
  if (!t) return null;
  if (t.k === "num") return t.v.length <= 5 ? numValue(t) : null;
  if (isTag(t, "num")) return /** @type {number} */ (t.val);
  return null;
}

/**
 * "in 2 weeks", "2 weeks ago", "3 days from now", "ago 2 days".
 *
 * @param {Token[]} toks
 * @param {number} i
 * @returns {Phrase | null}
 */
function readShift(toks, i) {
  const first = toks[i];
  let at = i;
  /** @type {1 | -1 | 0} */
  let sign = 0;
  if (isTag(first, "in")) {
    sign = 1;
    at++;
  } else if (isTag(first, "ago")) {
    sign = -1;
    at++;
  }
  const amount = quantity(toks[at]);
  const unit = toks[at + 1];
  if (amount === null || !isTag(unit, "unit")) return null;
  at += 2;
  if (sign === 0) {
    const next = toks[at];
    if (isTag(next, "ago")) {
      sign = -1;
      at++;
    } else if (isTag(next, "later")) {
      sign = 1;
      at++;
    } else if (isTag(next, "from") && isTag(toks[at + 1], "now")) {
      sign = 1;
      at += 2;
    } else {
      return null;
    }
  }
  const u = /** @type {"m" | "h" | "d" | "w" | "M" | "y"} */ (unit.val);
  const sub = u === "m" || u === "h";
  return {
    used: at - i,
    date: { type: "shift", n: sign * amount, unit: u },
    time: sub ? { shift: true } : undefined,
  };
}

/**
 * A time: "3pm", "3 pm", "3:30", "15:00:00", and "3" after "at".
 *
 * With no "am" or "pm", a 12-hour locale reads 1 to 6 as the afternoon, since
 * a working day has no meetings at 3 in the morning ("at 3", "2:30"). A
 * zero in front ("02:30") and a 24-hour locale read the hour as written.
 *
 * @param {Token[]} toks
 * @param {number} i
 * @param {boolean} twelveHour
 * @returns {Phrase | null}
 */
function readClock(toks, i, twelveHour) {
  const hourTok = toks[i];
  if (!isNum(hourTok, 1, 2)) return null;
  let h = numValue(hourTok);
  let at = i + 1;
  let m = 0;
  let colon = false;
  if (isSep(toks[at], ":") && isNum(toks[at + 1], 2, 2)) {
    colon = true;
    m = numValue(toks[at + 1]);
    at += 2;
    if (isSep(toks[at], ":") && isNum(toks[at + 1], 2, 2)) {
      if (numValue(toks[at + 1]) > 59) return { used: 0, fail: "invalid-time" };
      at += 2;
    }
  }
  const mer = toks[at];
  if (isTag(mer, "mer")) {
    at++;
    if (h < 1 || h > 12 || m > 59) return { used: 0, fail: "invalid-time" };
    h = (h % 12) + (mer.val === "pm" ? 12 : 0);
  } else if (colon) {
    if (h > 23 || m > 59) return { used: 0, fail: "invalid-time" };
    if (twelveHour && hourTok.v.length === 1 && h >= 1 && h <= 6) h += 12;
  } else if (isTag(toks[i - 1], "at")) {
    if (h > 23) return { used: 0, fail: "invalid-time" };
    if (twelveHour && hourTok.v.length === 1 && h >= 1 && h <= 6) h += 12;
  } else {
    return null;
  }
  return { used: at - i, time: { h, m } };
}

/**
 * Day number or year of a date written with numbers.
 *
 * @param {string} v
 * @param {number} nowYear
 * @returns {number | null}
 */
function readYear(v, nowYear) {
  if (v.length === 4) return Number(v);
  if (v.length !== 2) return null;
  // Two digits: the year within fifty years either side of this one.
  const n = Number(v);
  const century = Math.floor(nowYear / 100) * 100;
  let year = century + n;
  if (year > nowYear + 49) year -= 100;
  else if (year < nowYear - 50) year += 100;
  return year;
}

/**
 * "3/12", "3/12/26", "12.3.2026", "2026-12-03".
 *
 * @param {Token[]} toks
 * @param {number} i
 * @param {"mdy" | "dmy" | "ymd"} order
 * @param {number} nowYear
 * @returns {Phrase | null}
 */
function readNumeric(toks, i, order, nowYear) {
  const first = toks[i];
  const s1 = toks[i + 1];
  if (
    !isNum(first, 1, 4) ||
    !(isSep(s1, "/") || isSep(s1, "-") || isSep(s1, "."))
  ) {
    return null;
  }
  const second = toks[i + 2];
  if (!isNum(second, 1, 4)) return null;
  let at = i + 3;
  /** @type {Token | undefined} */
  let third;
  const s2 = toks[at];
  if (
    (isSep(s2, "/") || isSep(s2, "-") || isSep(s2, ".")) &&
    isNum(toks[at + 1], 1, 4)
  ) {
    third = toks[at + 1];
    at += 2;
  }
  // A time follows ("3:30") or this was a clock, not a date.
  if (isSep(toks[at], ":")) return null;

  const a = numValue(first);
  const b = numValue(second);
  const used = at - i;

  if (third) {
    const c = numValue(third);
    if (first.v.length === 4 || order === "ymd") {
      const year = readYear(first.v, nowYear);
      if (year === null || second.v.length > 2 || third.v.length > 2)
        return null;
      return ymd(used, year, b, c, null);
    }
    const year = readYear(third.v, nowYear);
    if (year === null || first.v.length > 2 || second.v.length > 2) return null;
    const m = order === "mdy" ? a : b;
    const d = order === "mdy" ? b : a;
    const swap = order === "mdy" ? { month: b, day: a } : { month: a, day: b };
    return ymd(used, year, m, d, swap);
  }
  if (first.v.length === 4 || second.v.length > 2 || first.v.length > 2) {
    return null;
  }
  // Two numbers: the locale's order of month and day. A locale that puts
  // the year first still writes the month before the day.
  const m = order === "dmy" ? b : a;
  const d = order === "dmy" ? a : b;
  const swap = order === "dmy" ? { month: a, day: b } : { month: b, day: a };
  return ymd(used, null, m, d, swap);
}

/**
 * @param {number} used
 * @param {number | null} year
 * @param {number} month
 * @param {number} day
 * @param {{ month: number, day: number } | null} swap
 * @returns {Phrase}
 */
function ymd(used, year, month, day, swap) {
  return {
    used,
    date: { type: "ymd", year, month, day, swap },
  };
}

/**
 * A month name with a day, and a year after it: "dec 3", "december 3rd
 * 2027", "3 dec", "3rd of december", "3. dez 2027".
 *
 * @param {Token[]} toks
 * @param {number} i
 * @returns {Phrase | null}
 */
function readMonthDay(toks, i) {
  const t = toks[i];
  let month = 0;
  let day = 0;
  let at = i;
  if (isTag(t, "month")) {
    month = /** @type {number} */ (t.val);
    const d = toks[i + 1];
    if (!isNum(d, 1, 2)) return null;
    day = numValue(d);
    at = i + 2;
    if (isTag(toks[at], "ordinal")) at++;
  } else if (isNum(t, 4, 4) && isTag(toks[i + 1], "month")) {
    // Year first: "2026 jan 5", as Hungarian writes it.
    const d = toks[i + 2];
    if (!isNum(d, 1, 2)) return null;
    return {
      used: 3,
      date: {
        type: "ymd",
        year: numValue(t),
        month: /** @type {number} */ (toks[i + 1].val),
        day: numValue(d),
        swap: null,
      },
    };
  } else if (isNum(t, 1, 2)) {
    day = numValue(t);
    at = i + 1;
    if (isTag(toks[at], "ordinal")) at++;
    while (isTag(toks[at], "fill")) at++;
    const m = toks[at];
    if (!isTag(m, "month")) return null;
    month = /** @type {number} */ (m.val);
    at++;
  } else {
    return null;
  }
  // A four-digit year, unless a clock follows it.
  const y = toks[at];
  /** @type {number | null} */
  let year = null;
  if (
    isNum(y, 4, 4) &&
    !isSep(toks[at + 1], ":") &&
    !isTag(toks[at + 1], "mer")
  ) {
    year = numValue(y);
    at++;
  }
  return {
    used: at - i,
    date: { type: "ymd", year, month, day, swap: null },
  };
}

/**
 * "next friday", "last week", "this month", "next 3rd" is not a phrase.
 *
 * @param {Token[]} toks
 * @param {number} i
 * @returns {Phrase | null}
 */
function readModifier(toks, i) {
  const mod = /** @type {number} */ (toks[i].val);
  const target = toks[i + 1];
  if (isTag(target, "weekday")) {
    const mode = mod > 0 ? "next" : mod < 0 ? "last" : "this";
    return {
      used: 2,
      date: { type: "weekday", wd: /** @type {number} */ (target.val), mode },
    };
  }
  if (isTag(target, "unit")) {
    const unit = target.val;
    if (unit === "w" || unit === "M" || unit === "y") {
      return { used: 2, date: { type: "period", unit, mod } };
    }
  }
  return null;
}

/**
 * "end of day", "end of week", "end of next month", and "eow".
 *
 * @param {Token[]} toks
 * @param {number} i
 * @returns {Phrase | null}
 */
function readEndOf(toks, i) {
  let at = i + 1;
  while (isTag(toks[at], "fill")) at++;
  let mod = 0;
  if (isTag(toks[at], "mod")) {
    mod = /** @type {number} */ (toks[at].val);
    at++;
  }
  const unit = toks[at];
  if (!isTag(unit, "unit")) return null;
  const u = unit.val;
  if (u === "d" && mod === 0) return { used: at + 1 - i, time: { eod: true } };
  if (u === "w" || u === "M" || u === "y") {
    return { used: at + 1 - i, date: { type: "endOf", unit: u, mod } };
  }
  return null;
}

/**
 * The next phrase at `i`, or `null` when none starts there.
 *
 * @param {Token[]} toks
 * @param {number} i
 * @param {Context} ctx
 * @returns {Phrase | null}
 */
function readPhrase(toks, i, ctx) {
  const t = toks[i];
  // A dot left over after a date: "2026. jan. 5. 14:15".
  if (t.k === "sep") return t.v === "." ? { used: 1 } : null;
  if (t.k === "num") {
    return (
      readShift(toks, i) ??
      readMonthDay(toks, i) ??
      readNumeric(toks, i, ctx.order, ctx.today.year) ??
      readClock(toks, i, ctx.twelveHour) ??
      readDayOfMonth(toks, i)
    );
  }
  switch (t.tag) {
    case "fill":
    case "at":
      return { used: 1 };
    case "day":
      return {
        used: 1,
        date: { type: "days", n: /** @type {number} */ (t.val) },
      };
    case "now":
      return { used: 1, date: { type: "now" }, time: { now: true } };
    case "time": {
      const [h, m] = /** @type {[number, number]} */ (t.val);
      return { used: 1, time: { h, m } };
    }
    case "eod":
      return { used: 1, time: { eod: true } };
    case "eow":
    case "eom":
    case "eoy":
      return {
        used: 1,
        date: {
          type: "endOf",
          unit: t.tag === "eow" ? "w" : t.tag === "eom" ? "M" : "y",
          mod: 0,
        },
      };
    case "end":
      return readEndOf(toks, i);
    case "mod":
      return readModifier(toks, i);
    case "weekday":
      return {
        used: 1,
        date: {
          type: "weekday",
          wd: /** @type {number} */ (t.val),
          mode: "bare",
        },
      };
    case "month":
      return readMonthDay(toks, i);
    case "in":
    case "ago":
    case "num":
      return readShift(toks, i);
    default:
      return null;
  }
}

/**
 * "15th", "1st".
 *
 * @param {Token[]} toks
 * @param {number} i
 * @returns {Phrase | null}
 */
function readDayOfMonth(toks, i) {
  if (isNum(toks[i], 1, 2) && isTag(toks[i + 1], "ordinal")) {
    return { used: 2, date: { type: "dayOfMonth", day: numValue(toks[i]) } };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Resolving to a day
// ---------------------------------------------------------------------------

/**
 * @typedef {object} Context
 * @property {number} now
 * @property {string} locale
 * @property {NaturalDatePack} pack
 * @property {"mdy" | "dmy" | "ymd"} order
 * @property {boolean} twelveHour
 * @property {string} timeZone
 * @property {number} weekStart
 * @property {NaturalDatePrefer} prefer
 * @property {[number, number]} eod
 * @property {[number, number]} workWeek
 * @property {number} todayN
 * @property {{ year: number, month: number, day: number, hour: number, minute: number }} today
 */

/**
 * Pick one of `candidates` (day numbers) by the preference.
 *
 * @param {number[]} candidates
 * @param {number} todayN
 * @param {NaturalDatePrefer} prefer
 * @returns {number | null}
 */
function pickDay(candidates, todayN, prefer) {
  /** @type {number | null} */
  let best = null;
  for (const c of candidates) {
    if (prefer === "future") {
      if (c >= todayN && (best === null || c < best)) best = c;
    } else if (prefer === "past") {
      if (c <= todayN && (best === null || c > best)) best = c;
    } else if (
      best === null ||
      Math.abs(c - todayN) < Math.abs(best - todayN) ||
      (Math.abs(c - todayN) === Math.abs(best - todayN) && c > best)
    ) {
      best = c;
    }
  }
  return best;
}

/**
 * The day a month and day name when no year is written.
 *
 * @param {number} month
 * @param {number} day
 * @param {Context} ctx
 * @returns {number | null}
 */
function yearlessDay(month, day, ctx) {
  /** @type {number[]} */
  const candidates = [];
  for (let offset = -8; offset <= 8; offset++) {
    const year = ctx.today.year + offset;
    if (isValidDay(year, month, day))
      candidates.push(dayNumber(year, month, day));
  }
  return pickDay(candidates, ctx.todayN, ctx.prefer);
}

/**
 * @param {DateSpec} spec
 * @param {Context} ctx
 * @returns {{ n: number } | { fail: NaturalDateFailure } }
 */
function resolveDay(spec, ctx) {
  const { todayN, today, weekStart, workWeek } = ctx;
  const current = weekdayOf(todayN);
  const weekFirst = todayN - ((current - weekStart + 7) % 7);

  switch (spec.type) {
    case "now":
      return { n: todayN };
    case "days":
      return { n: todayN + spec.n };
    case "weekday": {
      const wd = spec.wd;
      const forward = (wd - current + 7) % 7;
      const backward = (current - wd + 7) % 7;
      switch (spec.mode) {
        case "this":
          return {
            n: ctx.prefer === "past" ? todayN - backward : todayN + forward,
          };
        case "next":
          return { n: weekFirst + 7 + ((wd - weekStart + 7) % 7) };
        case "last":
          return { n: todayN - (backward || 7) };
        default:
          return {
            n:
              ctx.prefer === "past"
                ? todayN - (backward || 7)
                : todayN + (forward || 7),
          };
      }
    }
    case "period": {
      if (spec.unit === "w") {
        return {
          n: weekFirst + 7 * spec.mod + ((workWeek[0] - weekStart + 7) % 7),
        };
      }
      if (spec.unit === "M") {
        const first = addMonths(today.year, today.month, 1, spec.mod);
        if (!first) return { fail: "out-of-range" };
        return { n: dayNumber(first.year, first.month, 1) };
      }
      const year = today.year + spec.mod;
      if (year < MIN_YEAR || year > MAX_YEAR) return { fail: "out-of-range" };
      return { n: dayNumber(year, 1, 1) };
    }
    case "endOf": {
      if (spec.unit === "w") {
        const n =
          weekFirst + 7 * spec.mod + ((workWeek[1] - weekStart + 7) % 7);
        // The end of a week that is over is next week's.
        return {
          n:
            spec.mod === 0 && ctx.prefer === "future" && n < todayN ? n + 7 : n,
        };
      }
      if (spec.unit === "M") {
        const moved = addMonths(today.year, today.month, 1, spec.mod);
        if (!moved) return { fail: "out-of-range" };
        return {
          n: dayNumber(
            moved.year,
            moved.month,
            daysInMonth(moved.year, moved.month),
          ),
        };
      }
      const year = today.year + spec.mod;
      if (year < MIN_YEAR || year > MAX_YEAR) return { fail: "out-of-range" };
      return { n: dayNumber(year, 12, 31) };
    }
    case "shift": {
      if (spec.unit === "d" || spec.unit === "w") {
        const n = todayN + spec.n * (spec.unit === "w" ? 7 : 1);
        const year = fromDayNumber(n).year;
        if (year < MIN_YEAR || year > MAX_YEAR) return { fail: "out-of-range" };
        return { n };
      }
      const moved = addMonths(
        today.year,
        today.month,
        today.day,
        spec.n * (spec.unit === "y" ? 12 : 1),
      );
      if (!moved) return { fail: "out-of-range" };
      return { n: dayNumber(moved.year, moved.month, moved.day) };
    }
    case "dayOfMonth": {
      if (spec.day < 1 || spec.day > 31) return { fail: "invalid-date" };
      /** @type {number[]} */
      const candidates = [];
      for (let offset = -14; offset <= 14; offset++) {
        const moved = addMonths(today.year, today.month, 1, offset);
        if (moved && spec.day <= daysInMonth(moved.year, moved.month)) {
          candidates.push(dayNumber(moved.year, moved.month, spec.day));
        }
      }
      const n = pickDay(candidates, todayN, ctx.prefer);
      return n === null ? { fail: "out-of-range" } : { n };
    }
    default: {
      if (spec.year !== null) {
        if (!isValidDay(spec.year, spec.month, spec.day)) {
          return { fail: "invalid-date" };
        }
        return { n: dayNumber(spec.year, spec.month, spec.day) };
      }
      const n = yearlessDay(spec.month, spec.day, ctx);
      return n === null ? { fail: "invalid-date" } : { n };
    }
  }
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

/**
 * @param {unknown} value
 * @returns {[number, number]}
 */
function readClockOption(value) {
  if (Array.isArray(value) && value.length === 2) {
    const [h, m] = value;
    if (
      Number.isInteger(h) &&
      Number.isInteger(m) &&
      h >= 0 &&
      h < 24 &&
      m >= 0 &&
      m < 60
    ) {
      return [h, m];
    }
  }
  if (typeof value === "string") {
    const colon = value.indexOf(":");
    if (colon > 0 && colon <= 2 && value.length <= 5) {
      const h = Number(value.slice(0, colon));
      const m = Number(value.slice(colon + 1));
      if (Number.isInteger(h) && Number.isInteger(m) && h < 24 && m < 60) {
        return [h, m];
      }
    }
  }
  return [17, 0];
}

/**
 * @param {NaturalDateOptions} options
 * @returns {Context}
 */
function resolveContext(options) {
  const locale = canonicalLocale(options.locale);
  let timeZone = "UTC";
  if (typeof options.timeZone === "string" && options.timeZone) {
    try {
      zoneFormatter(options.timeZone);
      timeZone = options.timeZone;
    } catch {
      // An unknown zone reads as UTC.
    }
  }
  let now = options.now == null ? Date.now() : new Date(options.now).getTime();
  if (!Number.isFinite(now)) now = Date.now();
  // The minute, so "in 2 hours" and a bare time agree.
  now -= ((now % MINUTE) + MINUTE) % MINUTE;
  const today = wallTime(now, timeZone);
  const ws = options.weekStart;
  const weekStart =
    typeof ws === "number" && Number.isInteger(ws) && ws >= 0 && ws <= 6
      ? ws
      : resolveWeekInfo(locale).firstDay;
  const ww = options.workWeek;
  const workWeek =
    Array.isArray(ww) &&
    ww.length === 2 &&
    ww.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)
      ? /** @type {[number, number]} */ (ww)
      : /** @type {[number, number]} */ ([1, 5]);
  const prefer =
    options.prefer === "past" || options.prefer === "nearest"
      ? options.prefer
      : "future";
  return {
    locale,
    pack: options.pack ?? NATURAL_DATE_EN,
    order: naturalDateOrder(locale),
    twelveHour: usesTwelveHourClock(locale),
    now,
    timeZone,
    weekStart,
    prefer,
    eod: readClockOption(options.eod),
    workWeek,
    todayN: dayNumber(today.year, today.month, today.day),
    today,
  };
}

// ---------------------------------------------------------------------------
// The parser
// ---------------------------------------------------------------------------

/**
 * @param {NaturalDateFailure} reason
 * @param {number} index
 * @returns {NaturalDateFailed}
 */
function failure(reason, index) {
  return { ok: false, reason, index };
}

/**
 * Read a date, and a time, from text.
 *
 * Never throws and reads at most `NATURAL_DATE_MAX_LENGTH` characters. A
 * result with `ok: false` says why and where the reading stopped.
 *
 * - A weekday alone is the next one after today: "friday" on a Friday is
 *   next week's. "this friday" counts today. "next friday" is the Friday of
 *   next week, so on Wednesday it is nine days off, and the week starts on
 *   `weekStart`. "last friday" is the latest one before today.
 * - "next week" is the first working day of next week, "next month" its
 *   first day. "end of week" is the last working day.
 * - A date with no year, and a bare time, roll by `prefer`.
 * - "3/12" is read in the locale's order, and `ambiguous` says the other
 *   order is a date too. When the locale's order is impossible, the other
 *   is read, and `swapped` is `true`.
 *
 * @param {string} input
 * @param {NaturalDateOptions} [options]
 * @returns {NaturalDateParsed | NaturalDateFailed}
 */
export function parseNaturalDate(input, options = {}) {
  if (typeof input !== "string") return failure("empty", 0);
  if (input.length > NATURAL_DATE_MAX_LENGTH) {
    return failure("too-long", NATURAL_DATE_MAX_LENGTH);
  }
  const ctx = resolveContext(options ?? {});
  const text = input.normalize("NFKC");
  const read = tokenize(text, lexicon(ctx.locale, ctx.pack));
  if ("bad" in read) return failure("unrecognized", read.bad);
  const toks = read.tokens;
  if (toks.length === 0) return failure("empty", 0);

  /** @type {DateSpec | null} */
  let date = null;
  /** @type {TimeSpec | null} */
  let time = null;
  let i = 0;
  while (i < toks.length) {
    const phrase = readPhrase(toks, i, ctx);
    if (phrase === null) return failure("unrecognized", toks[i].s);
    if (phrase.fail) return failure(phrase.fail, toks[i].s);
    if (phrase.date) {
      const next = phrase.date;
      const absolute = next.type === "ymd";
      if (date === null) {
        date = next;
      } else if (date.type === "weekday" && date.mode === "bare" && absolute) {
        // "Fri Nov 14": the weekday only labels the date.
        date = next;
      } else if (!(
        next.type === "weekday" &&
        next.mode === "bare" &&
        date.type === "ymd"
      )) {
        return failure("unrecognized", toks[i].s);
      }
    }
    if (phrase.time) {
      if (time !== null) return failure("unrecognized", toks[i].s);
      time = phrase.time;
    }
    i += phrase.used;
  }
  if (date === null && time === null) return failure("empty", 0);
  return resolve(date, time, ctx);
}

/**
 * @param {DateSpec | null} date
 * @param {TimeSpec | null} time
 * @param {ReturnType<typeof resolveContext>} ctx
 * @returns {NaturalDateParsed | NaturalDateFailed}
 */
function resolve(date, time, ctx) {
  const { timeZone } = ctx;
  /** @type {number} */
  let instant;
  let hasTime = true;
  /** @type {Date | null} */
  let alternative = null;
  let swapped = false;

  if (date && date.type === "shift" && time && time.shift) {
    const ms = date.unit === "m" ? MINUTE : HOUR;
    instant = ctx.now + date.n * ms;
    if (!Number.isFinite(instant) || Math.abs(instant) > 8.64e15 - 2 * DAY) {
      return failure("out-of-range", 0);
    }
    const year = wallTime(instant, timeZone).year;
    if (year < MIN_YEAR || year > MAX_YEAR) return failure("out-of-range", 0);
  } else if (date && date.type === "now") {
    instant = ctx.now;
  } else {
    /** @type {{ h: number, m: number } | null} */
    let clock = null;
    if (time) {
      clock = time.eod
        ? { h: ctx.eod[0], m: ctx.eod[1] }
        : { h: time.h ?? 0, m: time.m ?? 0 };
    }
    hasTime = clock !== null;
    /** @type {number} */
    let n;
    if (date) {
      let spec = date;
      let resolved = resolveDay(spec, ctx);
      // The locale's order was impossible ("25/12" in the US): the other.
      if (
        "fail" in resolved &&
        resolved.fail === "invalid-date" &&
        spec.type === "ymd" &&
        spec.swap
      ) {
        spec = { ...spec, ...spec.swap, swap: null };
        const retry = resolveDay(spec, ctx);
        if ("n" in retry) {
          resolved = retry;
          swapped = true;
        }
      }
      if ("fail" in resolved) return failure(resolved.fail, 0);
      n = resolved.n;
      if (date.type === "ymd" && date.swap && !swapped) {
        const other = resolveDay({ ...date, ...date.swap, swap: null }, ctx);
        if ("n" in other && other.n !== n) {
          const w = fromDayNumber(other.n);
          alternative = new Date(
            instantFromWall(
              w.year,
              w.month,
              w.day,
              clock?.h ?? 0,
              clock?.m ?? 0,
              timeZone,
            ),
          );
        }
      }
    } else {
      // A time alone: today, or the next time it is that time.
      n = ctx.todayN;
      if (clock && !time?.eod && ctx.prefer !== "nearest") {
        const w = fromDayNumber(n);
        const todays = instantFromWall(
          w.year,
          w.month,
          w.day,
          clock.h,
          clock.m,
          timeZone,
        );
        if (ctx.prefer === "future" && todays < ctx.now) n += 1;
        else if (ctx.prefer === "past" && todays > ctx.now) n -= 1;
      }
    }
    const w = fromDayNumber(n);
    if (w.year < MIN_YEAR || w.year > MAX_YEAR)
      return failure("out-of-range", 0);
    instant = instantFromWall(
      w.year,
      w.month,
      w.day,
      clock?.h ?? 0,
      clock?.m ?? 0,
      timeZone,
    );
  }

  const wall = wallTime(instant, timeZone);
  return {
    ok: true,
    date: new Date(instant),
    year: wall.year,
    month: wall.month,
    day: wall.day,
    hour: wall.hour,
    minute: wall.minute,
    hasTime,
    ambiguous: alternative !== null,
    alternative,
    swapped,
  };
}

// ---------------------------------------------------------------------------
// The calendar of a zone
// ---------------------------------------------------------------------------

/**
 * @typedef {object} NaturalDateWall
 * @property {number} year
 * @property {number} month - 1 to 12.
 * @property {number} day
 * @property {number} hour
 * @property {number} minute
 */

/**
 * @param {string | undefined} timeZone
 * @returns {string}
 */
function knownZone(timeZone) {
  if (!timeZone) return "UTC";
  try {
    zoneFormatter(timeZone);
    return timeZone;
  } catch {
    return "UTC";
  }
}

/**
 * The date and time on the wall of `timeZone` at an instant.
 *
 * @param {Date | number} date
 * @param {string} [timeZone] - Default `"UTC"`.
 * @returns {NaturalDateWall}
 */
export function naturalDateWall(date, timeZone) {
  return wallTime(+date, knownZone(timeZone));
}

/**
 * The instant at which the wall of `timeZone` reads a date and time. A time
 * that happens twice is the first one, and a time that never happens is
 * read an hour later.
 *
 * @param {NaturalDateWall} wall
 * @param {string} [timeZone] - Default `"UTC"`.
 * @returns {Date}
 */
export function naturalDateFromWall(wall, timeZone) {
  return new Date(
    instantFromWall(
      wall.year,
      wall.month,
      wall.day,
      wall.hour,
      wall.minute,
      knownZone(timeZone),
    ),
  );
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/**
 * @typedef {object} NaturalDateFormatOptions
 * @property {string} [locale] - Default `"en"`.
 * @property {string} [timeZone] - Default `"UTC"`.
 * @property {boolean} [hasTime] - Include the time. Default `false`.
 * @property {"long" | "short"} [style] - `"long"` is the readback ("Friday, Nov 14, 2026, 3:00 PM"), `"short"` the text a field shows ("Nov 14, 2026, 3:00 PM").
 * @property {boolean} [timeZoneName] - Add the zone's short name after the time. Default `false`.
 */

/**
 * Write a date the way the parser reads it back. Latin digits and the
 * Gregorian calendar in every locale, since those are what a person types.
 *
 * @param {Date | number} date
 * @param {NaturalDateFormatOptions} [options]
 * @returns {string}
 */
export function formatNaturalDate(date, options = {}) {
  const time = +date;
  if (!Number.isFinite(time)) return "";
  const locale = canonicalLocale(options.locale);
  let timeZone = "UTC";
  if (options.timeZone) {
    try {
      zoneFormatter(options.timeZone);
      timeZone = options.timeZone;
    } catch {
      // An unknown zone reads as UTC.
    }
  }
  /** @type {Intl.DateTimeFormatOptions} */
  const format = {
    timeZone,
    calendar: "gregory",
    numberingSystem: "latn",
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  if (options.style !== "short") format.weekday = "long";
  if (options.hasTime) {
    format.hour = "numeric";
    format.minute = "2-digit";
    if (options.timeZoneName) format.timeZoneName = "short";
  }
  try {
    const formatter = getDateTimeFormatter(locale, format);
    if (options.style !== "short") return formatter.format(time);
    // The words a locale puts between the parts ("de" in Portuguese, "klo" in
    // Finnish, the "г." after a Russian year) are not ones the parser reads, so
    // the field's text keeps the numbers, the names and the punctuation.
    let text = "";
    for (const part of formatter.formatToParts(time)) {
      const word = part.type === "literal" && WORDS.test(part.value);
      text += word ? " " : part.value;
    }
    // Intl writes a no-break space before "PM".
    return text.replace(NO_BREAK, " ").split(" ").filter(Boolean).join(" ");
  } catch {
    return "";
  }
}

// Applied to Intl output, never to the typed text.
const WORDS = /[\p{L}\p{M}]/u;
const NO_BREAK = /[\u00a0\u202f]/g;
