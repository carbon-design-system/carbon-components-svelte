export type Weekday = "MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU";
export type RecurrenceFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
export type RecurrenceWeekday = { day: Weekday; nth?: number };
export type RecurrenceRule = {
  freq: RecurrenceFrequency;
  interval: number;
  byDay?: RecurrenceWeekday[];
  byMonthDay?: number[];
  byMonth?: number[];
  weekStart?: Weekday;
  count?: number;
  until?: Date;
};
export type CalendarDay = { year: number; month: number; day: number };

/** Indexed like `Date#getDay()`. */
export const WEEKDAYS: readonly Weekday[];

export function daysInMonth(year: number, month: number): number;

export function parseRRule(text: string): RecurrenceRule | null;

export function formatRRule(rule: RecurrenceRule): string;

export function occurrenceDays(
  rule: RecurrenceRule,
  start: CalendarDay,
  options?: { limit?: number; from?: CalendarDay },
): CalendarDay[];

export function calendarDayOf(date: Date): CalendarDay;

export function occurrences(
  rule: RecurrenceRule,
  start: Date,
  options?: { limit?: number; from?: Date },
): Date[];

export function monthlyChoices(start: CalendarDay): Array<{
  id: "day" | "nth" | "lastWeekday" | "lastDay";
  byMonthDay?: number[];
  byDay?: RecurrenceWeekday[];
}>;

export function weekdayPosition(start: CalendarDay): {
  nth: number;
  isLast: boolean;
};
