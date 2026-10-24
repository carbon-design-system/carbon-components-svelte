import { render, screen } from "@testing-library/svelte";
import DateCalendar from "carbon-components-svelte/DatePicker/DateCalendar.svelte";
import { user } from "../utils/user";

describe("DateCalendar", () => {
  it("moves through days and months from the keyboard, and picks with Enter", async () => {
    render(DateCalendar, {
      value: new Date(2024, 2, 15),
      today: new Date(2024, 2, 9),
    });

    screen.getByRole("gridcell", { name: "Friday, March 15, 2024" }).focus();
    await user.keyboard("{ArrowDown}{PageDown}{Enter}");

    expect(screen.getByRole("grid")).toHaveAccessibleName("April 2024");
    expect(
      screen.getByRole("gridcell", { selected: true }),
    ).toHaveAccessibleName("Monday, April 22, 2024");
    expect(document.activeElement).toBe(
      screen.getByRole("gridcell", { selected: true }),
    );
  });

  it.each([
    ["en", "March 2024"],
    ["ja", "2024年3月"],
    ["zh", "2024年3月"],
    ["ar", "مارس 2024"],
  ])("writes the %s heading in the locale's order", (locale, heading) => {
    render(DateCalendar, { locale, month: new Date(2024, 2, 15) });

    expect(screen.getByRole("grid")).toHaveAccessibleName(heading);
    expect(
      document.querySelector(".bx--date-picker__month-label"),
    ).toHaveTextContent(heading);
  });
});
