export interface FlatpickrInstance {
  calendarContainer: HTMLElement;
  days: HTMLElement;
  daysContainer?: HTMLElement;
  weekdayContainer: HTMLElement;
  selectedDates: unknown[];
  l10n: {
    months: { longhand: string[] };
    weekdays?: { shorthand?: string[] };
  };
  currentMonth: number;
  monthNav: HTMLElement;
  monthsDropdownContainer: HTMLElement;
}

export interface CreateCalendarArgs {
  options: { locale?: string; mode?: string };
  base: HTMLElement;
  input: HTMLInputElement;
  dispatch: (event: string) => void;
}

/**
 * Creates a flatpickr calendar instance with Carbon styling and optional range plugin.
 * @param args - Destructured options, base element, input, and dispatch callback
 * @returns Promise resolving to the flatpickr instance
 */
export function createCalendar(
  args: CreateCalendarArgs,
): Promise<FlatpickrInstance>;
