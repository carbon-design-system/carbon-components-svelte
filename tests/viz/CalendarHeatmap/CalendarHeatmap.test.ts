import { render, screen, within } from "@testing-library/svelte";
import { user } from "../../utils/user";
import CalendarHeatmap from "./CalendarHeatmap.test.svelte";

const table = () =>
  screen.getByRole("table", { name: "Contributions in 2026" });
const days = () =>
  Array.from(table().querySelectorAll<HTMLElement>(".bx--viz-calendar__day"));
const dayWith = (text: string) =>
  days().find((day) => day.textContent?.includes(text));

describe("CalendarHeatmap", () => {
  it("is a captioned table of the year: months across, weekdays down", () => {
    render(CalendarHeatmap);

    expect(
      within(table())
        .getAllByRole("columnheader")
        .map((th) => th.textContent?.trim()),
    ).toEqual([
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ]);
    expect(
      within(table())
        .getAllByRole("rowheader")
        .map((th) => th.textContent?.trim()),
    ).toEqual(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
    expect(days()).toHaveLength(365);
  });

  it("starts the week where asked", () => {
    render(CalendarHeatmap, { weekStart: 1 });

    expect(within(table()).getAllByRole("rowheader")[0]).toHaveTextContent(
      "Mon",
    );
  });

  it("puts every day's date and total in the table as text", () => {
    render(CalendarHeatmap);

    expect(dayWith("January 5")).toHaveTextContent("Monday, January 5: 5");
    expect(dayWith("January 7")).toHaveTextContent(
      "Wednesday, January 7: No data",
    );
  });

  it("colors days by their total and outlines days with no data", () => {
    render(CalendarHeatmap);

    expect(
      dayWith("January 12")?.style.getPropertyValue("--bx-viz-color"),
    ).toBe("var(--cds-viz-seq-teal-11)");
    // A recorded zero is data: it gets the low end, not the empty outline.
    const zero = dayWith("January 6");
    expect(zero?.style.getPropertyValue("--bx-viz-color")).toBe(
      "var(--cds-viz-seq-teal-02)",
    );
    expect(zero).not.toHaveClass("bx--viz-calendar__day--empty");
    expect(dayWith("January 7")).toHaveClass("bx--viz-calendar__day--empty");
  });

  it("renders no buttons unless selectable", () => {
    render(CalendarHeatmap);

    expect(within(table()).queryAllByRole("button")).toEqual([]);
  });

  it("selects a day, with one tab stop on the latest day with data", async () => {
    const onselect = vi.fn();
    render(CalendarHeatmap, { selectable: true, onselect });

    const stops = within(table())
      .getAllByRole("button")
      .filter((button) => button.tabIndex === 0);
    expect(stops).toHaveLength(1);
    expect(stops[0]).toHaveTextContent("January 12");

    stops[0].focus();
    // Left is the week before, Down the next day.
    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toHaveTextContent("January 5");
    await user.keyboard("{ArrowDown}{Enter}");
    expect(document.activeElement).toHaveTextContent("January 6");
    expect(document.activeElement).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("selected")).toHaveTextContent("2026-01-06");
    expect(onselect.mock.calls[0][0]).toMatchObject({
      day: { iso: "2026-01-06", value: 0 },
    });
  });
});
