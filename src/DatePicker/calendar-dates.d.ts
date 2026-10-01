export interface CalendarLocale {
  weekdays: { shorthand: string[]; longhand: string[] };
  months: { shorthand: string[]; longhand: string[] };
  firstDayOfWeek: number;
  rangeSeparator: string;
  ordinal?: (day: number) => string;
}

export interface FormatContext {
  getWeek?: (date: Date) => number;
}

export interface ParseContext {
  l10n: CalendarLocale;
  dateFormat: string;
  parseDate?: (value: string, format: string) => Date | undefined;
  onError: (error: Error) => void;
}

export const DAY_MS: number;

/**
 * A locale key such as `"de"`, resolved through `Intl`, or a partial
 * locale object merged over Carbon's English.
 */
export function getCalendarLocale(locale: unknown): CalendarLocale;

/** ISO 8601 week number. */
export function isoWeek(date: Date): number;

/**
 * Formats with flatpickr's date tokens. A backslash escapes the next
 * character.
 */
export function formatDate(
  date: Date,
  format: string,
  l10n: CalendarLocale,
  context?: FormatContext,
): string;

/**
 * Parses a date, string, or timestamp. Reports and returns `undefined` for
 * anything unparseable.
 */
export function parseDate(
  value: unknown,
  context: ParseContext,
  givenFormat?: string,
  timeless?: boolean,
): Date | undefined;

/**
 * Day ordering ignoring time of day: negative, zero, or positive. The
 * magnitude is not a day count.
 */
export function compareDays(a: Date, b: Date): number;

export function daysInMonth(year: number, month: number): number;

/**
 * Whether `locale` orders the month before the year ("January 2000") as
 * opposed to year before month ("2000年1月").
 */
export function isMonthFirst(locale: unknown): boolean;
