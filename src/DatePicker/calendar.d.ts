import type { CalendarLocale } from "./calendar-dates.js";

export type CalendarMode =
  | "single"
  | "multiple"
  | "range"
  | "week"
  | "month"
  | "quarter"
  | "year";

export type CalendarHook = (
  selectedDates: Date[],
  dateStr: string,
  instance: CalendarInstance,
  data?: unknown,
) => void;

export type CalendarPlugin = (
  instance: CalendarInstance,
) =>
  | Partial<Record<CalendarHookName, CalendarHook | CalendarHook[]>>
  | undefined;

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

export interface CalendarOptions
  extends Partial<Record<CalendarHookName, CalendarHook | CalendarHook[]>> {
  allowInput?: boolean;
  allowInvalidPreload?: boolean;
  altFormat?: string;
  altInput?: boolean;
  altInputClass?: string;
  animate?: boolean;
  appendTo?: HTMLElement;
  ariaDateFormat?: string;
  clickOpens?: boolean;
  closeOnSelect?: boolean;
  conjunction?: string;
  dateFormat?: string;
  defaultDate?: string | number | Date | Array<string | number | Date>;
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
  ignoredFocusElements?: HTMLElement[];
  inline?: boolean;
  /**
   * Blocks a day from being picked or focused with the keyboard without
   * disabling it as a value, so typed and programmatic dates are not
   * checked against it.
   */
  /**
   * Build the header and grid on first open instead of at creation, unless
   * the calendar is inline or has plugins.
   */
  lazy?: boolean;
  isDayBlocked?: (date: Date, instance: CalendarInstance) => boolean;
  locale?: string | Partial<CalendarLocale>;
  maxDate?: string | number | Date;
  minDate?: string | number | Date;
  mode?: CalendarMode;
  nextArrow?: string;
  /** The date the calendar treats as today. Defaults to the current date. */
  now?: string | number | Date;
  parseDate?: (value: string, format: string) => Date | undefined;
  plugins?: CalendarPlugin[];
  position?:
    | string
    | ((instance: CalendarInstance, customElement?: HTMLElement) => void);
  positionElement?: HTMLElement;
  prevArrow?: string;
  secondInput?: HTMLInputElement;
  shorthandCurrentMonth?: boolean;
  showMonths?: number;
  static?: boolean;
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
  createDay(
    className: string,
    date: Date,
    dayNumber: number,
    index: number,
  ): HTMLElement;
  onMouseOver(element?: HTMLElement): void;
  now: Date;
  /** Always `false`: the calendar never swaps in a native date input. */
  isMobile: false;
  /** flatpickr plugin compatibility: plugins register their names here. */
  loadedPlugins: string[];
  /** flatpickr plugin compatibility: focusable controls plugins add. */
  pluginElements: Node[];
  utils: { getDaysInMonth(month?: number, year?: number): number };
  pad(value: string | number): string;
  updateValue(triggerChange?: boolean): void;
  _bind(
    target: EventTarget | EventTarget[],
    type: string | string[],
    handler: EventListener,
    options?: AddEventListenerOptions,
  ): void;
  _createElement<E extends HTMLElement = HTMLElement>(
    tag: string,
    className?: string,
    content?: string,
  ): E;
  _positionCalendar(customPositionElement?: HTMLElement): void;
}

/**
 * Builds a calendar on `element`. Returns `null` when the engine cannot be
 * created.
 */
export function createCalendarEngine(
  element: HTMLInputElement,
  config?: CalendarOptions,
): CalendarInstance | null;
