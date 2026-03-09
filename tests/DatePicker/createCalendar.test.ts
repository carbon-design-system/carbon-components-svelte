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
});
