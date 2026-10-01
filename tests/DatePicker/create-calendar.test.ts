import { createCalendar } from "../../src/DatePicker/create-calendar.js";

const setup = () => {
  const base = document.createElement("input");
  const input = document.createElement("input");
  document.body.append(base, input);
  return { base, input, dispatch: vi.fn() };
};

describe("createCalendar", () => {
  it("resolves to an instance in every mode", async () => {
    const modes = ["single", "multiple", "month", "year", "week"] as const;
    const instances = await Promise.all(
      modes.map((mode) => {
        const { base, input, dispatch } = setup();
        return createCalendar({ options: { mode }, base, input, dispatch });
      }),
    );
    for (const instance of instances) {
      expect(instance).not.toBeNull();
      instance?.destroy();
    }
  });

  it("writes the second input of a range", async () => {
    const { base, input, dispatch } = setup();
    const instance = await createCalendar({
      options: { mode: "range", dateFormat: "Y-m-d" },
      base,
      input,
      dispatch,
    });

    instance?.setDate([new Date(2024, 2, 4), new Date(2024, 2, 9)]);

    expect(base.value).toBe("2024-03-04");
    expect(input.value).toBe("2024-03-09");
    instance?.destroy();
  });

  it("defaults ariaDateFormat to include the weekday", async () => {
    const { base, input, dispatch } = setup();
    const instance = await createCalendar({
      options: {
        mode: "single",
        dateFormat: "Y-m-d",
        defaultDate: "2024-03-15",
      },
      base,
      input,
      dispatch,
    });

    expect(instance?.config.ariaDateFormat).toBe("l, F j, Y");
    const day = instance?.calendarContainer.querySelector(".selected");
    expect(day?.getAttribute("aria-label")).toBe("Friday, March 15, 2024");
    instance?.destroy();
  });

  it("dispatches open, close, and change", async () => {
    const { base, input, dispatch } = setup();
    const instance = await createCalendar({
      options: { mode: "single" },
      base,
      input,
      dispatch,
    });

    instance?.open();
    instance?.setDate(new Date(2024, 0, 2), true);
    instance?.close();

    expect(dispatch.mock.calls.map(([event]) => event)).toEqual([
      "open",
      "change",
      "close",
    ]);
    instance?.destroy();
  });

  it("returns null and logs when the engine throws", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const { base, input, dispatch } = setup();
    const instance = await createCalendar({
      options: {
        mode: "single",
        plugins: [
          () => {
            throw new Error("plugin failed");
          },
        ],
      },
      base,
      input,
      dispatch,
    });

    expect(instance).toBeNull();
    expect(consoleError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "plugin failed" }),
    );
    consoleError.mockRestore();
  });
});
