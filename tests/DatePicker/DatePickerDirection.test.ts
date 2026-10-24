import { render, screen, waitFor } from "@testing-library/svelte";
import { user } from "../utils/user";
import DatePickerDirection from "./DatePickerDirection.test.svelte";

/** Press a key, then wait for the day named `name` to take focus. */
async function press(key: string, name: string) {
  await user.keyboard(`{${key}}`);
  await waitFor(() =>
    expect(screen.getByRole("gridcell", { name })).toHaveFocus(),
  );
}

describe("DatePicker writing direction", () => {
  afterEach(() => {
    document.documentElement.style.removeProperty("direction");
  });

  it.each([
    ["DatePicker", false],
    ["DateCalendar", true],
  ])(
    "moves to the next day with ArrowLeft in RTL (%s)",
    async (_name, standalone) => {
      render(DatePickerDirection, { props: { standalone } });
      const start = await screen.findByRole("gridcell", {
        name: "Friday, March 15, 2024",
      });
      start.focus();

      await press("ArrowLeft", "Saturday, March 16, 2024");
      await press("ArrowRight", "Friday, March 15, 2024");
      await press("ArrowRight", "Thursday, March 14, 2024");
      await press("ArrowDown", "Thursday, March 21, 2024");
    },
  );

  it.each([
    ["DatePicker", false],
    ["DateCalendar", true],
  ])(
    "lets a LayoutDirection win over the computed direction (%s)",
    async (_name, standalone) => {
      document.documentElement.style.direction = "rtl";
      render(DatePickerDirection, { props: { dir: "ltr", standalone } });
      const start = await screen.findByRole("gridcell", {
        name: "Friday, March 15, 2024",
      });
      start.focus();

      await press("ArrowRight", "Saturday, March 16, 2024");
    },
  );
});
