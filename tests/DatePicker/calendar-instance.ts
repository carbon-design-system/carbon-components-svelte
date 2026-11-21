import { render } from "@testing-library/svelte";
import type { ComponentProps } from "svelte";
import type { CalendarInstance as Instance } from "../../src/DatePicker/calendar";
import { calendarOf } from "../../src/DatePicker/calendar-registry.js";
import DatePickerCalendar from "./DatePickerCalendar.test.svelte";

/**
 * Returns the calendar instance attached to an `<input>`, asserting that
 * it has been initialized.
 */
export function getCalendarInstance(input: Element): Instance {
  const instance = calendarOf(input);
  assert(
    instance,
    "expected the input to have an initialized calendar instance",
  );
  return instance;
}

/**
 * Renders the `bind:calendar` fixture and waits for its calendar instance,
 * returning it alongside the render result.
 */
export async function renderCalendar(
  props: Omit<ComponentProps<DatePickerCalendar>, "oncalendar"> = {},
) {
  let ready = false;
  const result = render(DatePickerCalendar, {
    props: {
      ...props,
      oncalendar: (cal: unknown) => {
        ready = Boolean(cal);
      },
    },
  });
  // `bind:calendar` is the documented API; tests reach the engine through
  // the input it is attached to.
  const instance = await vi.waitFor(() => {
    assert(ready, "calendar not set");
    const input = [...result.container.querySelectorAll("input")].find(
      (element) => calendarOf(element),
    );
    assert(input, "no input with a calendar");
    return getCalendarInstance(input);
  });
  return { ...result, instance };
}
