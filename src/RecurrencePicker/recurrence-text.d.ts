import type { RecurrenceRule, Weekday } from "../utils/recurrence.js";

export type RecurrenceFormat = {
  weekday: (day: Weekday, width?: "long" | "short") => string;
  /** `month` is 0-based. */
  month: (month: number, width?: "long" | "short") => string;
  list: (items: string[]) => string;
  date: (year: number, month: number, day: number) => string;
  fullDate: (year: number, month: number, day: number) => string;
  unit: (unit: "day" | "week" | "month" | "year", count: number) => string;
};

export type RecurrencePickerText = {
  frequency: string;
  doesNotRepeat: string;
  daily: string;
  weekly: string;
  monthly: string;
  yearly: string;
  interval: string;
  weekdays: string;
  monthlyPattern: string;
  ends: string;
  never: string;
  afterCount: string;
  onDate: string;
  count: string;
  until: string;
  preview: string;
  custom: string;
  monthDay: (day: number) => string;
  /** `nth` is `-1` for the last. */
  monthNth: (nth: number, weekday: string) => string;
  monthLastDay: string;
};

export type RecurrenceSummaryContext = {
  locale: string;
  startDate: Date;
  format: RecurrenceFormat;
};

export function createFormat(locale: string): RecurrenceFormat;

export const DEFAULT_TEXT: RecurrencePickerText;

export function defaultSummary(
  rule: RecurrenceRule,
  context: RecurrenceSummaryContext,
): string;
