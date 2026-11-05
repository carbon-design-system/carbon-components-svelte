import type { CalendarLocale } from "./calendar-dates.js";

export type CalendarMode =
  "single" | "multiple" | "range" | "week" | "month" | "quarter" | "year";

export type CalendarHook = (
  selectedDates: Date[],
  dateStr: string,
  instance: CalendarInstance,
  data?: unknown,
) => void;

export type CalendarHookName =
  | "onChange"
  | "onClose"
  | "onDayCreate"
  | "onDestroy"
  | "onKeyDown"
  | "onMonthChange"
  | "onOpen"
  | "onParseConfig"
  | "onPreCalendarPosition"
  | "onReady"
  | "onValueUpdate"
  | "onYearChange";

export type DateRule =
  | string
  | number
  | Date
  | { from: string | Date; to: string | Date }
  | ((date: Date) => boolean);

export interface CalendarOptions extends Partial<
  Record<CalendarHookName, CalendarHook | CalendarHook[]>
> {
  allowInput?: boolean;
  allowInvalidPreload?: boolean;
  altFormat?: string;
  altInput?: boolean;
  animate?: boolean;
  appendTo?: HTMLElement;
  ariaDateFormat?: string;
  clickOpens?: boolean;
  closeOnSelect?: boolean;
  conjunction?: string;
  dateFormat?: string;
  defaultDate?: string | number | Date | Array<string | number | Date>;
  /** 24-hour `"HH:mm"` or `"HH:mm:ss"` given to a day picked with no time set. */
  defaultTime?: string;
  disable?: DateRule[];
  enable?: DateRule[];
  errorHandler?: (error: Error) => void;
  formatDate?: (date: Date, format: string, locale: CalendarLocale) => string;
  /** Text added to a day's label for screen readers; marks the day. */
  dayDescription?: (date: Date) => string | undefined;
  /** Extra class(es) for a day cell. */
  dayClass?: (date: Date) => string | undefined;
  /**
   * First day of the week, 0 (Sunday) to 6 (Saturday). Overrides the
   * locale's own.
   */
  firstDayOfWeek?: number;
  getWeek?: (date: Date) => number;
  /** The time row's clock. Defaults to `"12"`. */
  hourFormat?: "12" | "24";
  ignoredFocusElements?: HTMLElement[];
  inline?: boolean;
  /**
   * Blocks a day from being picked or focused with the keyboard without
   * disabling it as a value, so typed and programmatic dates are not
   * checked against it.
   */
  /**
   * Build the header and grid on first open instead of at creation, unless
   * the calendar is inline.
   */
  lazy?: boolean;
  isDayBlocked?: (date: Date, instance: CalendarInstance) => boolean;
  locale?: string | Partial<CalendarLocale>;
  maxDate?: string | number | Date;
  minDate?: string | number | Date;
  /** Minutes per step in the time row; must divide 60. */
  minuteStep?: number;
  mode?: CalendarMode;
  nextArrow?: string;
  /** The date the calendar treats as today. Defaults to the current date. */
  now?: string | number | Date;
  parseDate?: (value: string, format: string) => Date | undefined;
  /**
   * `"auto"`, `"above"` or `"below"`, then an optional `"start"`,
   * `"center"` or `"end"` (or physical `"left"`/`"right"`), or a function
   * that places the calendar.
   */
  position?:
    | string
    | ((instance: CalendarInstance, customElement?: HTMLElement) => void);
  positionElement?: HTMLElement;
  prevArrow?: string;
  /** Label of the previous month (year, decade) button. */
  prevLabel?: string;
  /** Label of the next month (year, decade) button. */
  nextLabel?: string;
  /**
   * Read on each ArrowLeft/ArrowRight and each placement. When it returns
   * `true`, ArrowLeft moves to the next day (month, year) and the calendar
   * opens at the anchor's right edge. Defaults to the calendar's computed
   * direction.
   */
  rtl?: () => boolean;
  secondInput?: HTMLInputElement;
  shorthandCurrentMonth?: boolean;
  showMonths?: number;
  static?: boolean;
  /** Shows a time row below the days, down to this unit. Single mode only. */
  timeGranularity?: "hour" | "minute" | "second";
  /** Accessible name of the time row. Defaults to `"Time"`. */
  timeLabel?: string;
  weekNumbers?: boolean;
}

export interface CalendarInstance {
  config: Required<
    Pick<CalendarOptions, "dateFormat" | "conjunction" | "ignoredFocusElements">
  > &
    CalendarOptions & {
      minDate?: Date;
      maxDate?: Date;
      _enable?: unknown;
      _disable: unknown[];
    };
  l10n: CalendarLocale;
  input: HTMLInputElement;
  altInput?: HTMLInputElement;
  secondInput?: HTMLInputElement;
  element: HTMLInputElement;
  _input: HTMLInputElement;
  _positionElement: HTMLElement;
  calendarContainer: HTMLElement;
  monthNav: HTMLElement;
  innerContainer: HTMLElement;
  rContainer: HTMLElement;
  daysContainer: HTMLElement;
  days: HTMLElement;
  weekdayContainer: HTMLElement;
  prevMonthNav: HTMLElement;
  nextMonthNav: HTMLElement;
  yearElements: HTMLInputElement[];
  monthElements: HTMLElement[];
  currentYearElement: HTMLInputElement;
  selectedDateElem?: HTMLElement;
  todayDateElem?: HTMLElement;
  selectedDates: Date[];
  latestSelectedDateObj?: Date;
  currentYear: number;
  currentMonth: number;
  isOpen: boolean;
  open(event?: Event, positionElement?: HTMLElement): void;
  close(): void;
  toggle(event?: Event): void;
  clear(triggerChangeEvent?: boolean, toInitial?: boolean): void;
  destroy(): void;
  redraw(): void;
  /** Disables, or makes read-only, the parts the picker can't block by events. */
  setBlocked(state: undefined | "disabled" | "readonly"): void;
  set(option: string | CalendarOptions, value?: unknown): void;
  setDate(date: unknown, triggerChange?: boolean, format?: string): void;
  jumpToDate(date?: unknown, triggerChange?: boolean): void;
  changeMonth(value: number, isOffset?: boolean): void;
  changeYear(year: number): void;
  isEnabled(date: Date | string | number, timeless?: boolean): boolean;
  parseDate(
    value: unknown,
    format?: string,
    timeless?: boolean,
  ): Date | undefined;
  formatDate(date: Date, format: string): string;
  onMouseOver(element?: HTMLElement): void;
  now: Date;
}

/**
 * The step ArrowLeft (37) or ArrowRight (39) takes through the cells: `1`
 * to the next cell, `-1` to the previous one, `0` for any other key code.
 */
export function inlineStep(code: number, rtl: boolean): -1 | 0 | 1;

/**
 * Builds a calendar on `element`. Returns `null` when the engine cannot be
 * created.
 */
export function createCalendarEngine(
  element: HTMLInputElement,
  config?: CalendarOptions,
): CalendarInstance | null;
