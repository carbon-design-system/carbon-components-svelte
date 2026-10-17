export interface FlatpickrInstance {
  calendarContainer: HTMLElement;
  input: HTMLInputElement;
  altInput?: HTMLInputElement;
  days: HTMLElement;
  daysContainer?: HTMLElement;
  weekdayContainer: HTMLElement;
  selectedDates: unknown[];
  l10n: {
    months: { longhand: string[]; shorthand: string[] };
    weekdays?: { shorthand?: string[] };
  };
  config: { shorthandCurrentMonth?: boolean; locale?: unknown };
  currentMonth: number;
  monthNav: HTMLElement;
  monthsDropdownContainer: HTMLElement;
  rContainer?: HTMLElement | null;
}

export interface CreateCalendarArgs {
  options: {
    locale?: string;
    mode?: string;
    dateFormat?: string;
    altFormat?: string;
    errorHandler?: (error: Error) => void;
    ignoredFocusElements?: HTMLElement[];
    [option: string]: unknown;
  };
  base: HTMLInputElement;
  input: HTMLInputElement;
  dispatch: (event: string, detail?: unknown) => void;
  isDayBlocked?: (date: Date, instance: FlatpickrInstance) => boolean;
}

/**
 * Swaps the consumer `errorHandler` of a calendar while keeping Carbon's
 * wrapper, and the `error` event it dispatches, in place.
 */
export function setErrorHandler(
  instance: FlatpickrInstance,
  handler: ((error: Error) => void) | undefined,
): void;

/**
 * Creates a flatpickr calendar instance with Carbon styling and optional range plugin.
 * @param args - Destructured options, base element, input, and dispatch callback
 * @returns Promise resolving to the flatpickr instance
 */
export function createCalendar(
  args: CreateCalendarArgs,
): Promise<FlatpickrInstance | null>;

/**
 * Maps the `"en"` locale key to Carbon's English locale, and passes any
 * other locale through.
 */
export function resolveLocale(locale: unknown): unknown;

/**
 * Value to pass to `calendar.set(name, ...)` for a consumer option, keeping
 * Carbon's hooks in front of a consumer hook instead of replacing them.
 */
export function resolveOptionValue(
  instance: object,
  name: string,
  value: unknown,
): unknown;

/**
 * Resyncs Carbon's `.cur-month` header label after a programmatic
 * navigation that suppressed flatpickr's own `onMonthChange` hook.
 */
export function updateMonthNode(
  instance: FlatpickrInstance,
  locale: unknown,
): void;
