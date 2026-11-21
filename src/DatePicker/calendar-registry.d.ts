import type { CalendarInstance } from "./calendar.js";

export function attachCalendar(
  input: Element,
  calendar: CalendarInstance,
): void;

export function detachCalendar(input: Element): void;

export function calendarOf(input: Element): CalendarInstance | undefined;

export function markCalendarEvent<E extends Event>(event: E): E;

export function isCalendarEvent(event: Event): boolean;
