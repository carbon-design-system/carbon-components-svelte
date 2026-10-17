import { renderCalendar } from "./flatpickr-instance";

const mountRange = () => renderCalendar({ datePickerType: "range" });

describe("DatePicker range ignoredFocusElements", () => {
  it("does not share the array with other instances", async () => {
    const first = await mountRange();
    const firstElements = first.instance.config.ignoredFocusElements;
    expect(firstElements).toHaveLength(1);
    first.unmount();

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
