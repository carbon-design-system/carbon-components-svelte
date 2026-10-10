export type CalendarGridOptions<T> = {
  date: (row: T, index: number) => unknown;
  value: (row: T, index: number) => unknown;
  /** Defaults to the year of the latest date, or the current year. */
  year?: number;
  /** First day of the week, 0 for Sunday. @default 0 */
  weekStart?: number;
};

export type CalendarDay<T> = {
  date: Date;
  /** Local date as `YYYY-MM-DD`. */
  iso: string;
  week: number;
  /** Slot within the week, 0 for `weekStart`. */
  weekday: number;
  /** Sum of the day's rows, or `null` for a day with none. */
  value: number | null;
  data: T[];
};

export type CalendarWeek<T> = {
  index: number;
  /** Seven slots. Slots outside the year are `null`. */
  days: Array<CalendarDay<T> | null>;
};

export type CalendarMonth = {
  /** 0 for January. */
  month: number;
  /** Week column that holds the first of the month. */
  week: number;
  /** Week columns until the next month starts. */
  span: number;
};

export type CalendarGrid<T> = {
  year: number;
  weeks: CalendarWeek<T>[];
  months: CalendarMonth[];
  /** Day of week (0 for Sunday) of each slot. */
  weekdays: number[];
  min: number;
  max: number;
};

/**
 * One column per week of `year`, each with seven day slots that start on
 * `weekStart`. Slots outside the year are `null`. Values of rows that fall on
 * the same day are summed; a day with no rows has a `null` value. Dates are
 * read in local time.
 */
export function buildCalendarGrid<T>(
  rows: ReadonlyArray<T>,
  options: CalendarGridOptions<T>,
): CalendarGrid<T>;
