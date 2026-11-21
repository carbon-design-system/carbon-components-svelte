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
 * The calendar attached to `input`, if any.
 *
 * @param {Element} input
 */
export function calendarOf(input) {
  return calendars.get(input);
}
