import type { CalendarLocale } from "./calendar-dates.js";

export type TimeGranularity = "hour" | "minute" | "second";
export type HourCycle = "12" | "24";
export type TimeParts = { hours: number; minutes: number; seconds: number };

export function hasTimeToken(format: string): boolean;
export function resolveHourCycle(
  hourFormat: "auto" | HourCycle,
  dateFormat: string,
  locale: unknown,
): HourCycle;
export function timeFormat(
  granularity: TimeGranularity,
  hourCycle: HourCycle,
): string;
export function effectiveDateFormat(
  dateFormat: string,
  granularity: TimeGranularity | undefined,
  hourCycle: HourCycle,
): string;
export function parseTimeString(text: unknown): TimeParts | undefined;
export function timeOf(date: Date): TimeParts;
export function withTime(
  date: Date,
  time: TimeParts,
  granularity?: TimeGranularity,
): Date;
export function isTimeOnDay(date: Date, time: TimeParts): boolean;

export type TimeRowOptions = {
  label: string;
  granularity: TimeGranularity;
  hourCycle: HourCycle;
  minuteStep: number;
  l10n: CalendarLocale;
  idPrefix: string;
  onChange: (time: TimeParts) => void;
  onEnter: () => void;
  /** Steps skip times this rejects. */
  isAllowed?: (time: TimeParts) => boolean;
};

export function createTimeRow(options: TimeRowOptions): {
  element: HTMLDivElement;
  setTime(next: TimeParts): void;
  setDisabled(disabled: boolean): void;
  setReadOnly(readOnly: boolean): void;
};
