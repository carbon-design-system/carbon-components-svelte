import type { CalendarInstance } from "./calendar.js";

/** What `bind:calendar` exposes. */
export interface DatePickerCalendar {
  open(): void;
  close(): void;
  /** Moves the view to the month that holds `date`. */
  showMonth(date: Date): void;
  /** Opens the calendar if needed and focuses the day for `date`. */
  focusDate(date: Date): void;
  readonly isOpen: boolean;
  /** The first day of the month on show (the first, with two months). */
  readonly view: Date;
  /** Copies, in selection order (range: start, then end). */
  readonly selectedDates: ReadonlyArray<Date>;
  /**
   * The raw calendar engine.
   * @deprecated Use the methods above; `engine` will be removed.
   */
  readonly engine: CalendarInstance;
}

export function createCalendarApi(engine: CalendarInstance): DatePickerCalendar;
