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
 * | `weekday` | 0 (Sunday) to 6 | An extra name for a day |
 * | `month` | 1 to 12 | An extra name for a month |
 *
 * Month and weekday names are not listed: they come from `Intl` for the
 * locale, and for the pack's own `locale`.
 */
export type NaturalDatePack = {
  id: string;
  /** Language whose month and weekday names are read as well as the locale's. */
  locale: string;
  words: Record<
    string,
    [tag: string, value?: number | string | [number, number]]
  >;
};

export type NaturalDatePrefer = "future" | "past" | "nearest";

export type NaturalDateOptions = {
  /** The instant "now" stands for. Default: the clock. */
  now?: Date | number | string;
  /** IANA name. Default `"UTC"`. */
  timeZone?: string;
  /** Sets the order of "3/12", and the names of months and days. Default `"en"`. */
  locale?: string;
  /** First day of the week, 0 (Sunday) to 6. Default: the locale's. */
  weekStart?: number;
  /** Which way a date with no year, and a bare time, roll. Default `"future"`. */
  prefer?: NaturalDatePrefer;
  /** "eod" as `"17:00"` or `[17, 0]`. Default `"17:00"`. */
  eod?: string | [number, number];
  /** First and last working day, 0 to 6. Default `[1, 5]`. */
  workWeek?: [first: number, last: number];
  /** Words of another language. Default English. */
  pack?: NaturalDatePack;
};

export type NaturalDateParsed = {
  ok: true;
  /** The instant. A date with no time is its first moment in the zone. */
  date: Date;
  /** The date on the zone's calendar. */
  year: number;
  /** 1 to 12. */
  month: number;
  day: number;
  hour: number;
  minute: number;
  /** `true` when the text named a time. */
  hasTime: boolean;
  /** `true` for "3/12": both orders are dates. `date` is the locale's. */
  ambiguous: boolean;
  /** The other reading of an ambiguous date. */
  alternative: Date | null;
  /** `true` when the locale's order was impossible ("25/12" in the US) and the other was read. */
  swapped: boolean;
};

export type NaturalDateFailure =
  | "empty"
  | "unrecognized"
  | "invalid-date"
  | "invalid-time"
  | "out-of-range"
  | "too-long";

export type NaturalDateFailed = {
  ok: false;
  reason: NaturalDateFailure;
  /** Where in the text the reading stopped. */
  index: number;
};

export type NaturalDateFormatOptions = {
  /** Default `"en"`. */
  locale?: string;
  /** Default `"UTC"`. */
  timeZone?: string;
  /** Include the time. Default `false`. */
  hasTime?: boolean;
  /**
   * `"long"` is the readback ("Friday, Nov 14, 2026, 3:00 PM"), `"short"`
   * the text a field shows ("Nov 14, 2026, 3:00 PM").
   */
  style?: "long" | "short";
  /** Add the zone's short name after the time. Default `false`. */
  timeZoneName?: boolean;
};

/** The most text the parser reads. */
export const NATURAL_DATE_MAX_LENGTH: number;

/** The English words: today, tomorrow, next, in, ago, units, noon, eod and more. */
export const NATURAL_DATE_EN: NaturalDatePack;

/**
 * The order a locale writes the day, month and year in: `"mdy"` (en-US),
 * `"dmy"` (en-GB, de, fr) or `"ymd"` (ja, sv, hu).
 */
export function naturalDateOrder(locale: string): "mdy" | "dmy" | "ymd";

/**
 * Read a date, and a time, from text such as "next Fri 3pm", "in 2 weeks",
 * "Dec 3", "3/12", "end of month" or "eod".
 *
 * Never throws and reads at most `NATURAL_DATE_MAX_LENGTH` characters. A
 * result with `ok: false` says why and where the reading stopped.
 */
export function parseNaturalDate(
  input: string,
  options?: NaturalDateOptions,
): NaturalDateParsed | NaturalDateFailed;

/**
 * Write a date the way the parser reads it back. Latin digits and the
 * Gregorian calendar in every locale, since those are what a person types.
 */
export function formatNaturalDate(
  date: Date | number,
  options?: NaturalDateFormatOptions,
): string;

export type NaturalDateWall = {
  year: number;
  /** 1 to 12. */
  month: number;
  day: number;
  hour: number;
  minute: number;
};

/** The date and time on the wall of `timeZone` at an instant. Default `"UTC"`. */
export function naturalDateWall(
  date: Date | number,
  timeZone?: string,
): NaturalDateWall;

/**
 * The instant at which the wall of `timeZone` reads a date and time. A time
 * that happens twice is the first one, and a time that never happens is
 * read an hour later.
 */
export function naturalDateFromWall(
  wall: NaturalDateWall,
  timeZone?: string,
): Date;
