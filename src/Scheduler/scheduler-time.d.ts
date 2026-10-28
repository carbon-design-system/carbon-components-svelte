export const MINUTE_MS: number;
export const DAY_MS: number;
export const MINUTES_PER_DAY: number;

/**
 * A calendar day: the days since 1970-01-01 of the wall-clock date in the
 * display zone. Adding days to it never meets a DST change.
 */
export type CivilDay = number;

export interface Zone {
  /** IANA name, or `undefined` for the browser's local zone. */
  timeZone: string | undefined;
  /** The wall-clock day and minute of the day an instant falls on. */
  parts(ms: number): { day: CivilDay; minute: number };
  /**
   * The instant of a wall-clock time. A minute outside `[0, 1440)` rolls
   * into the next or previous day. A skipped time lands after the gap and a
   * repeated time takes its first occurrence.
   */
  instant(day: CivilDay, minute: number): number;
}

export function civilDay(year: number, month: number, date: number): CivilDay;
export function dayFields(day: CivilDay): {
  year: number;
  month: number;
  date: number;
};
/** 0 = Sunday, like `Date.prototype.getDay()`. */
export function weekdayOf(day: CivilDay): number;
export function startOfWeek(day: CivilDay, firstDay: number): CivilDay;

/** The zone for an IANA name; the browser's local zone for none or an unknown one. */
export function getZone(timeZone: string | undefined): Zone;

export function resolveLocale(locale: string | undefined): string;
export function resolveHourCycle(
  hourFormat: "auto" | "12" | "24",
  locale: string,
): "12" | "24";
export function timeFormatter(
  locale: string,
  timeZone: string | undefined,
  hourCycle: "12" | "24",
): Intl.DateTimeFormat;
export function axisFormatter(
  locale: string,
  hourCycle: "12" | "24",
): (minute: number) => string;
export function dateFormatter(
  locale: string,
  timeZone: string | undefined,
  fields: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat;
export function dayFormatter(
  locale: string,
  fields: Intl.DateTimeFormatOptions,
): (day: CivilDay) => string;

/** The length of a day in minutes, and the wall-clock ranges it skips. */
export function dayInfo(
  zone: Zone,
  day: CivilDay,
): { length: number; skipped: Array<[number, number]> };
