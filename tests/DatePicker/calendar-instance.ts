import { render } from "@testing-library/svelte";
import type { ComponentProps } from "svelte";
import type { CalendarInstance as Instance } from "../../src/DatePicker/calendar";
import DatePickerCalendar from "./DatePickerCalendar.test.svelte";

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

/**
 * Renders the `bind:calendar` fixture and waits for its calendar instance,
 * returning it alongside the render result.
 */
export async function renderCalendar(
  props: Omit<ComponentProps<DatePickerCalendar>, "oncalendar"> = {},
) {
  let captured: Instance | null | undefined = null;
  const result = render(DatePickerCalendar, {
    props: {
      ...props,
      // `bind:calendar` is the documented API; tests reach the engine.
      oncalendar: (cal: { engine: Instance } | null | undefined) => {
        captured = cal?.engine;
      },
    },
  });
  const instance = await vi.waitFor(() => {
    assert(captured, "calendar not set");
    return captured;
  });
  return { ...result, instance };
}
