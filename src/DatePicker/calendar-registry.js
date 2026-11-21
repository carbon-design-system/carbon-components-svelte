// @ts-check

/**
 * The calendar attached to each input, so other components can find it
 * without reaching into the engine. Weak, so a removed input drops its
 * entry.
 *
 * @type {WeakMap<Element, import("./calendar.js").CalendarInstance>}
 */
const calendars = new WeakMap();

/**
 * @param {Element} input
 * @param {import("./calendar.js").CalendarInstance} calendar
 */
export function attachCalendar(input, calendar) {
  calendars.set(input, calendar);
}

/** @param {Element} input */
export function detachCalendar(input) {
  calendars.delete(input);
}

/**
 * Native `change`/`input` events the calendar dispatches itself after its
 * `onChange`, as opposed to ones the browser fires for typed text.
 *
 * @type {WeakSet<Event>}
 */
const calendarEvents = new WeakSet();

/**
 * @template {Event} E
 * @param {E} event
 */
export function markCalendarEvent(event) {
  calendarEvents.add(event);
  return event;
}

/**
 * Whether the calendar, not the browser, dispatched `event`.
 *
 * @param {Event} event
 */
export function isCalendarEvent(event) {
  return calendarEvents.has(event);
}

/**
 * The calendar attached to `input`, if any.
 *
 * @param {Element} input
 */
export function calendarOf(input) {
  return calendars.get(input);
}
