// @vitest-environment node
import DateCalendar from "carbon-components-svelte/DatePicker/DateCalendar.svelte";
import { renderSSR } from "../utils/ssr";

describe("DateCalendar server render", () => {
  it("renders the month grid with the picked day", () => {
    const { document } = renderSSR(DateCalendar, {
      value: new Date(2024, 2, 15),
      today: new Date(2024, 2, 9),
    });

    const grid = document.querySelector("[role=grid]");
    expect(grid).toHaveAttribute("aria-label", "March 2024");
    expect(grid?.querySelectorAll("[role=row]")).toHaveLength(6);
    expect(grid?.querySelectorAll("[role=gridcell]")).toHaveLength(42);
    expect(grid?.querySelector("[aria-selected=true]")).toHaveTextContent("15");
  });
});
