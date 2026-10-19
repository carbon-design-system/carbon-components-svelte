import type { CalendarInstance, CalendarMode } from "./calendar.js";

export interface CreateCalendarArgs {
  options: {
    locale?: string;
    mode?: CalendarMode;
    dateFormat?: string;
    altFormat?: string;
    ignoredFocusElements?: HTMLElement[];
    [option: string]: unknown;
  };
  base: HTMLInputElement;
  input: HTMLInputElement;
  dispatch: (event: string, detail?: unknown) => void;
  isDayBlocked?: (date: Date, instance: CalendarInstance) => boolean;
}

/**
 * Creates a calendar instance with Carbon's hooks (events, alt input
 * mirroring, error reporting) layered on the calendar engine.
 * @param args - Destructured options, base element, input, and dispatch callback
 * @returns Promise resolving to the calendar instance, or `null` when it
 * could not be created
 */
export function createCalendar(
  args: CreateCalendarArgs,
): Promise<CalendarInstance | null>;
