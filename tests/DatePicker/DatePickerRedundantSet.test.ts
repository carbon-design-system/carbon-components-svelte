import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import DatePicker from "./DatePicker.test.svelte";

const setCalls: string[] = [];

// `calendar.set` rebuilds the whole day grid, so record every call made on
// an instance, including the ones issued before a test could reach it.
vi.mock("../../src/DatePicker/calendar.js", async (importOriginal) => {
  const mod =
    await importOriginal<typeof import("../../src/DatePicker/calendar.js")>();
  return {
    ...mod,
    createCalendarEngine: (
      ...args: Parameters<typeof mod.createCalendarEngine>
    ) => {
      const instance = mod.createCalendarEngine(...args);
      if (instance) {
        const { set } = instance;
        instance.set = (...setArgs: Parameters<typeof set>) => {
          setCalls.push(String(setArgs[0]));
          return set.apply(instance, setArgs);
        };
      }
      return instance;
    },
  };
});

describe("DatePicker redundant calendar updates", () => {
  beforeEach(() => {
    setCalls.length = 0;
  });

  it("does not re-apply the options the calendar was created with", async () => {
    render(DatePicker, { datePickerType: "single" });
    await screen.findByLabelText("calendar-container");
    await tick();

    expect(setCalls).toEqual([]);
  });

  it("still applies clickOpens and allowInput when readonly changes", async () => {
    const { rerender } = render(DatePicker, { datePickerType: "single" });
    await screen.findByLabelText("calendar-container");
    await tick();

    await rerender({ datePickerType: "single", readonly: true });
    await tick();
    expect(setCalls).toEqual(["clickOpens", "allowInput"]);
  });
});
