import { render, screen, within } from "@testing-library/svelte";
import { user } from "../../utils/user";
import Heatmap from "./Heatmap.test.svelte";

const table = () => screen.getByRole("table", { name: "Requests by day" });

describe("Heatmap", () => {
  it("is a captioned table with row and column headers, and a value in every cell", () => {
    render(Heatmap);

    expect(
      within(table())
        .getAllByRole("columnheader")
        .map((th) => th.textContent),
    ).toEqual(["Block", "Mon", "Tue", "Wed"]);
    expect(
      within(table())
        .getAllByRole("rowheader")
        .map((th) => th.textContent),
    ).toEqual(["AM", "PM"]);
    // Values are in the table for assistive technology even when not drawn.
    const tue = within(table()).getAllByRole("row")[1].children[2];
    expect(tue).toHaveTextContent("10");
    expect(tue.querySelector("span")).toHaveClass("bx--visually-hidden");
  });

  it("colors cells by value and hatches the ones with no data", () => {
    render(Heatmap);

    const cells = Array.from(table().querySelectorAll<HTMLElement>("tbody td"));
    expect(cells[0].style.getPropertyValue("--bx-viz-color")).toBe(
      "var(--cds-viz-seq-blue-02)",
    );
    expect(cells[1].style.getPropertyValue("--bx-viz-color")).toBe(
      "var(--cds-viz-seq-blue-11)",
    );
    expect(cells[1].style.getPropertyValue("--bx-viz-text-color")).toBe(
      "var(--cds-viz-seq-on-11)",
    );
    expect(cells[2]).toHaveClass("bx--viz-heatmap__cell--empty");
  });

  it("writes values in the cells, and takes a diverging palette", () => {
    render(Heatmap, { cellLabels: true, palette: "red-cyan" });

    const cell = table().querySelector<HTMLElement>("tbody td");
    expect(cell?.querySelector("span")).not.toHaveClass("bx--visually-hidden");
    expect(cell?.style.getPropertyValue("--bx-viz-color")).toBe(
      "var(--cds-viz-div-red-cyan-01)",
    );
  });

  it("shows the ends of the ramp in a legend", () => {
    render(Heatmap);

    const legend = screen
      .getByTestId("heatmap")
      .querySelector(".bx--viz-heatmap__legend");
    expect(legend).toHaveTextContent(/^0\s*10$/);
    expect(legend).toHaveAttribute("aria-hidden", "true");
  });

  it("renders no buttons unless selectable", () => {
    render(Heatmap);

    expect(within(table()).queryAllByRole("button")).toEqual([]);
  });

  it("selects a cell, with one tab stop and arrow keys that skip empty cells", async () => {
    const onselect = vi.fn();
    render(Heatmap, { selectable: true, onselect });

    const buttons = within(table()).getAllByRole("button");
    // Mon/AM, Tue/AM, Mon/PM, Wed/PM
    expect(buttons.map((b) => b.tabIndex)).toEqual([0, -1, -1, -1]);

    buttons[0].focus();
    await user.keyboard("{ArrowDown}");
    expect(buttons[2]).toHaveFocus();
    // Tue/PM is empty, so Right lands on Wed/PM.
    await user.keyboard("{ArrowRight}");
    expect(buttons[3]).toHaveFocus();
    expect(buttons.map((b) => b.tabIndex)).toEqual([-1, -1, -1, 0]);

    await user.keyboard("{Enter}");
    expect(buttons[3]).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("selected")).toHaveTextContent("PM/Wed");
    expect(onselect.mock.calls[0][0]).toMatchObject({
      cell: { row: "PM", column: "Wed", value: 6 },
    });

    await user.keyboard("{Enter}");
    expect(screen.getByTestId("selected")).toHaveTextContent("");
  });
});
