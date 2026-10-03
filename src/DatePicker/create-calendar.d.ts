import type { CalendarInstance, CalendarMode } from "./calendar.js";

export interface CreateCalendarArgs {
  options: {
    locale?: string;
    mode?: CalendarMode;
    dateFormat?: string;
    altFormat?: string;
    errorHandler?: (error: Error) => void;
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
 * Updates the handler Carbon's `errorHandler` wrapper calls, without
 * replacing the wrapper (and the `error` event it dispatches).
 */
export function setErrorHandler(
  instance: CalendarInstance,
  handler: ((error: Error) => void) | undefined,
): void;
