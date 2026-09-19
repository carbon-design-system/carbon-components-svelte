import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import DatePicker from "./DatePicker.test.svelte";

const setCalls: string[] = [];

// `calendar.set` rebuilds the whole day grid, so record every call made on
// an instance, including the ones issued before a test could reach it.
vi.mock("flatpickr", async (importOriginal) => {
  const mod = await importOriginal<{
    default: new (...args: never[]) => unknown;
  }>();
  const Flatpickr = mod.default;
  function Recording(this: unknown, ...args: never[]) {
    const instance = new Flatpickr(...args) as {
      set?: (...setArgs: unknown[]) => unknown;
    };
    const { set } = instance;
    if (set) {
      instance.set = (...setArgs: unknown[]) => {
        setCalls.push(String(setArgs[0]));
        return set.apply(instance, setArgs);
      };
    }
    return instance;
  }
  return { ...mod, default: Object.assign(Recording, Flatpickr) };
});

describe("DatePicker redundant flatpickr updates", () => {
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
