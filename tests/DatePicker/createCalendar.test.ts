vi.mock("flatpickr", (importee) => ({
  ...importee,
  default: vi.fn(function FlatpickrMock() {
    return {};
  }),
}));

describe("createCalendar", () => {
  it("resolves without throw when mode is not range (RangePlugin guard)", async () => {
    const { createCalendar } = await import(
      "../../src/DatePicker/createCalendar.js"
    );
    const base = document.createElement("div");
    const input = document.createElement("input");
    const dispatch = vi.fn();

    await expect(
      createCalendar({
        options: { mode: "single" },
        base,
        input,
        dispatch,
      }),
    ).resolves.toBeDefined();
  });

  it("loads the monthSelect plugin when mode is month", async () => {
    const { createCalendar } = await import(
      "../../src/DatePicker/createCalendar.js"
    );
    const base = document.createElement("div");
    const input = document.createElement("input");
    const dispatch = vi.fn();

    await createCalendar({
      options: { mode: "month", dateFormat: "F Y" },
      base,
      input,
      dispatch,
    });

    const flatpickr = vi.mocked((await import("flatpickr")).default);
    const config = flatpickr.mock.calls.at(-1)?.[1];
    expect(config?.plugins).toHaveLength(1);
    expect(typeof config?.plugins?.[0]).toBe("function");
  });

  it("does not load a plugin when mode is single", async () => {
    const { createCalendar } = await import(
      "../../src/DatePicker/createCalendar.js"
    );
    const base = document.createElement("div");
    const input = document.createElement("input");
    const dispatch = vi.fn();

    await createCalendar({
      options: { mode: "single" },
      base,
      input,
      dispatch,
    });

    const flatpickr = vi.mocked((await import("flatpickr")).default);
    const config = flatpickr.mock.calls.at(-1)?.[1];
    expect(config?.plugins).toHaveLength(0);
  });
});
