import type { CalendarInstance } from "./calendar.js";

export function attachCalendar(
  input: Element,
  calendar: CalendarInstance,
): void;

export function detachCalendar(input: Element): void;

export function calendarOf(input: Element): CalendarInstance | undefined;
