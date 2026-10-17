import { render } from "@testing-library/svelte";
import type { Instance } from "flatpickr/dist/types/instance";
import type { ComponentProps } from "svelte";
import DatePickerCalendar from "./DatePickerCalendar.test.svelte";

/**
 * Returns the flatpickr `Instance` that flatpickr attaches to its `<input>`
 * element as `_flatpickr`, asserting that it has been initialized.
 */
export function getFlatpickrInstance(input: Element): Instance {
  const instance = (input as unknown as { _flatpickr?: Instance })._flatpickr;
  assert(
    instance,
    "expected the input to have an initialized flatpickr instance",
  );
  return instance;
}

/**
 * Renders the `bind:calendar` fixture and waits for its flatpickr instance,
 * returning it alongside the render result.
 */
export async function renderCalendar(
  props: Omit<ComponentProps<DatePickerCalendar>, "oncalendar"> = {},
) {
  let captured: Instance | null | undefined = null;
  const result = render(DatePickerCalendar, {
    props: {
      ...props,
      oncalendar: (cal: Instance | null | undefined) => {
        captured = cal;
      },
    },
  });
  const instance = await vi.waitFor(() => {
    assert(captured, "calendar not set");
    return captured;
  });
  return { ...result, instance };
}
