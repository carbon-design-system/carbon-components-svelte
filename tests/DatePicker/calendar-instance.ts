import type { CalendarInstance as Instance } from "../../src/DatePicker/calendar";

/**
 * Returns the calendar instance attached to its `<input>`
 * element as `_flatpickr`, asserting that it has been initialized.
 */
export function getCalendarInstance(input: Element): Instance {
  const instance = (input as unknown as { _flatpickr?: Instance })._flatpickr;
  assert(
    instance,
    "expected the input to have an initialized calendar instance",
  );
  return instance;
}
