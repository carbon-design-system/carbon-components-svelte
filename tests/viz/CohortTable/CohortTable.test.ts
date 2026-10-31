import { render, screen, within } from "@testing-library/svelte";
import { user } from "../../utils/user";
import CohortTable from "./CohortTable.test.svelte";

const table = () =>
  screen.getByRole("table", { name: "Retention by signup month" });
const cells = () =>
  within(table())
    .getAllByRole("row")
    .map((row) =>
      Array.from(row.children).map((cell) => cell.textContent?.trim() ?? ""),
    );

describe("CohortTable", () => {
  it("is a captioned table with a column per period and a triangle of values", () => {
    render(CohortTable);

    expect(cells()).toEqual([
      ["Cohort", "Users", "M0", "M1", "M2"],
      ["Jan", "1,000", "100%", "60%", "50%"],
      ["Feb", "3,000", "100%", "40%", ""],
      ["Mar", "2,000", "100%", "", ""],
    ]);
    expect(
      within(table())
        .getAllByRole("rowheader")
        .map((th) => th.textContent),
    ).toEqual(["Jan", "Feb", "Mar"]);
  });

  it("drops the size column when no cohort has a size", () => {
    render(CohortTable, {
      rows: [{ id: "a", label: "A", values: [1, 0.5] }],
    });

    expect(cells()[0]).toEqual(["Cohort", "M0", "M1"]);
  });

  it("colors cells on a ramp from 0 to 1 with a label that stays readable", () => {
    render(CohortTable);

    const filled = Array.from(
      table().querySelectorAll<HTMLElement>(".bx--viz-cohort__cell"),
    );
    expect(filled).toHaveLength(6);
    expect(filled[0].style.getPropertyValue("--bx-viz-color")).toBe(
      "var(--cds-viz-seq-blue-11)",
    );
    expect(filled[0].style.getPropertyValue("--bx-viz-text-color")).toBe(
      "var(--cds-viz-seq-on-11)",
    );
    expect(filled[1].style.getPropertyValue("--bx-viz-color")).toMatch(
      /seq-blue-0[78]\)$/,
    );
  });

  it("averages each period over the cohorts that reached it, weighted by size", () => {
    render(CohortTable, { summary: "average" });

    // M1: (0.6 * 1000 + 0.4 * 3000) / 4000 = 45%
    expect(cells().at(-1)).toEqual(["Average", "", "100%", "45%", "50%"]);
  });

  it("renders no buttons unless selectable", () => {
    render(CohortTable);

    expect(within(table()).queryAllByRole("button")).toEqual([]);
  });

  it("selects a cell, with one tab stop and arrow keys that stay in the triangle", async () => {
    const onselect = vi.fn();
    render(CohortTable, { selectable: true, onselect });

    const buttons = within(table()).getAllByRole("button");
    expect(buttons.map((b) => b.tabIndex)).toEqual([0, -1, -1, -1, -1, -1]);

    buttons[0].focus();
    await user.keyboard("{ArrowRight}{ArrowDown}");
    // Jan M1, then Feb M1.
    expect(document.activeElement).toHaveTextContent("40%");
    // Mar has no M1, so Down goes nowhere.
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toHaveTextContent("40%");

    await user.keyboard("{Enter}");
    expect(document.activeElement).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("selected")).toHaveTextContent("feb/1");
    expect(onselect.mock.calls[0][0]).toMatchObject({
      cohort: { id: "feb" },
      period: 1,
      value: 0.4,
    });
  });
});
