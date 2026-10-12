import { render } from "@testing-library/svelte";
import type { Instance } from "flatpickr/dist/types/instance";
import DatePickerCalendar from "./DatePickerCalendar.test.svelte";

const mountRange = async () => {
  let captured: Instance | null = null;
  const view = render(DatePickerCalendar, {
    props: {
      datePickerType: "range",
      oncalendar: (cal: Instance | null | undefined) => {
        captured = cal ?? null;
      },
    },
  });
  const instance = await vi.waitFor(() => {
    if (!captured) throw new Error("calendar not set");
    return captured as Instance;
  });
  return { instance, view };
};

describe("DatePicker range ignoredFocusElements", () => {
  it("does not share the array with other instances", async () => {
    const first = await mountRange();
    const firstElements = first.instance.config.ignoredFocusElements;
    expect(firstElements).toHaveLength(1);
    first.view.unmount();

    // flatpickr's range plugin pushes its second input into this array. A
    // default array shared across instances keeps every unmounted range
    // picker's input (and the detached tree it sits in) reachable forever.
    const second = await mountRange();
    const secondElements = second.instance.config.ignoredFocusElements;

    expect(secondElements).not.toBe(firstElements);
    expect(secondElements).toHaveLength(1);
    expect(secondElements).not.toContain(firstElements[0]);
  });
});
