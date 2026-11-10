import { render, screen, within } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import PivotTable from "./PivotTable.test.svelte";

const calls = vi.hoisted(() => ({ pivot: 0 }));
vi.mock("../../src/PivotTable/pivot.js", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("../../src/PivotTable/pivot.js")>();
  return {
    ...original,
    pivot: (...args: Parameters<typeof original.pivot>) => {
      calls.pivot++;
      return original.pivot(...args);
    },
  };
});

const grid = () => screen.getByRole("treegrid", { name: "Sales" });
const rowHeaders = () =>
  within(grid())
    .getAllByRole("rowheader")
    .map((cell) => cell.textContent?.trim());

describe("PivotTable", () => {
  beforeEach(() => {
    calls.pivot = 0;
  });

  it("renders the collapsed pivot as a named treegrid", () => {
    render(PivotTable);
    expect(grid()).toHaveAttribute("aria-readonly", "true");
    expect(rowHeaders()).toEqual(["APAC", "EMEA", "Grand total"]);
    const emea = within(grid()).getByRole("row", { name: /^EMEA/ });
    expect(emea).toHaveAttribute("aria-expanded", "false");
    expect(emea).toHaveAttribute("aria-level", "1");
    expect(
      within(grid())
        .getAllByRole("columnheader")
        .map((c) => c.textContent?.trim()),
    ).toEqual(["region / country", "2023", "2024", "Grand total"]);
    expect(
      within(emea)
        .getAllByRole("gridcell")
        .map((c) => c.textContent?.trim()),
    ).toEqual(["10", "50", "60"]);
  });

  it("opens a group by click and keyboard, and binds the ids", async () => {
    const { component } = render(PivotTable);
    await user.click(within(grid()).getByRole("rowheader", { name: "EMEA" }));
    expect(rowHeaders()).toEqual([
      "APAC",
      "EMEA",
      "France",
      "Spain",
      "Grand total",
    ]);
    expect(screen.getByTestId("rows")).toHaveTextContent("1");
    expect(component.events).toEqual(["row:EMEA:true"]);

    await user.keyboard("{Enter}");
    expect(rowHeaders()).toEqual(["APAC", "EMEA", "Grand total"]);
    await user.keyboard("{Shift>}{ArrowRight}{/Shift}");
    expect(rowHeaders()).toHaveLength(5);
    await user.keyboard("{Shift>}{ArrowLeft}{/Shift}");
    expect(rowHeaders()).toHaveLength(3);
    expect(component.events).toEqual([
      "row:EMEA:true",
      "row:EMEA:false",
      "row:EMEA:true",
      "row:EMEA:false",
    ]);
  });

  it("does not pivot again when only the expanded groups change", async () => {
    const { component, rerender } = render(PivotTable);
    expect(calls.pivot).toBe(1);
    await user.click(within(grid()).getByRole("rowheader", { name: "EMEA" }));
    await user.click(
      within(grid()).getByRole("columnheader", { name: "2024" }),
    );
    component.table?.expandAll();
    await tick();
    component.table?.collapseAll();
    await tick();
    expect(calls.pivot).toBe(1);

    await rerender({
      config: { rows: ["region"], values: [{ field: "amount" }] },
    });
    expect(calls.pivot).toBe(2);
    await rerender({ records: [{ region: "X", amount: 1 }] });
    expect(calls.pivot).toBe(3);
  });

  it("keeps an open group open across a data change", async () => {
    const { rerender } = render(PivotTable);
    await user.click(within(grid()).getByRole("rowheader", { name: "EMEA" }));
    await rerender({
      records: [
        { region: "EMEA", country: "Italy", year: 2023, amount: 5 },
        { region: "APAC", country: "Japan", year: 2023, amount: 6 },
      ],
    });
    expect(rowHeaders()).toEqual(["APAC", "EMEA", "Italy", "Grand total"]);
  });

  it("opens a column group with a subtotal column", async () => {
    const { component, rerender } = render(PivotTable);
    await user.click(
      within(grid()).getByRole("columnheader", { name: "2024" }),
    );
    expect(component.events).toEqual([]);
    // One field of columns: a leaf is not a group, so nothing opens.
    await rerender({
      config: {
        rows: ["region"],
        columns: ["year", "country"],
        values: [{ field: "amount" }],
      },
    });
    await user.click(
      within(grid()).getByRole("columnheader", { name: "2024" }),
    );
    expect(component.events).toEqual(["column:2024:true"]);
    expect(
      within(grid())
        .getAllByRole("columnheader")
        .map((c) => c.textContent?.trim()),
    ).toContain("2024 total");
  });

  it("moves between cells by arrow key with one tab stop", async () => {
    render(PivotTable);
    expect(grid().querySelectorAll('[tabindex="0"]')).toHaveLength(1);
    await user.tab();
    // The toolbar buttons come first.
    await user.tab();
    await user.tab();
    await user.tab();
    expect(document.activeElement).toHaveTextContent("APAC");
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toHaveTextContent("40");
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toHaveTextContent("10");
    await user.keyboard("{End}");
    expect(document.activeElement).toHaveTextContent("60");
    await user.keyboard("{ArrowUp}{ArrowUp}");
    expect(document.activeElement).toHaveTextContent("Grand total");
    expect(document.activeElement).toHaveAttribute("role", "columnheader");
    await user.keyboard("{Control>}{End}{/Control}");
    expect(document.activeElement).toHaveTextContent("100");
    expect(grid().querySelectorAll('[tabindex="0"]')).toHaveLength(1);
  });

  it("lists the records behind a cell, and honors preventDefault", async () => {
    const { component, rerender } = render(PivotTable);
    const emea = within(grid()).getByRole("row", { name: /^EMEA/ });
    await user.click(within(emea).getAllByRole("gridcell")[1]);
    expect(component.events).toEqual(["drill:EMEA|2024|2"]);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getAllByRole("row")).toHaveLength(3);

    await user.keyboard("{Escape}");
    await rerender({ prevent: true });
    await user.click(within(emea).getAllByRole("gridcell")[0]);
    expect(component.events).toHaveLength(2);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("skips the panel when drillDown is off", async () => {
    const { component } = render(PivotTable, { drillDown: false });
    const apac = within(grid()).getByRole("row", { name: /^APAC/ });
    await user.click(within(apac).getAllByRole("gridcell")[0]);
    expect(component.events).toEqual(["drill:APAC|2023|1"]);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows a message and dispatches pivot:error for a pivot over maxCells", async () => {
    const { component } = render(PivotTable, { maxCells: 2 });
    await tick();
    expect(screen.getByRole("alert")).toHaveTextContent(/more than 2 cells/);
    expect(screen.queryByRole("treegrid")).toBeNull();
    expect(component.events).toEqual(["error:RangeError"]);
  });

  it("shows the empty text when no record passes", () => {
    render(PivotTable, { records: [] });
    expect(screen.getByText("No records to pivot.")).toBeVisible();
    expect(screen.queryByRole("treegrid")).toBeNull();
  });

  it("exports the visible pivot", async () => {
    const { component } = render(PivotTable);
    await user.click(within(grid()).getByRole("rowheader", { name: "EMEA" }));
    expect(component.table?.toCsv().split("\r\n")).toEqual([
      "region,country,2023,2024,Grand total",
      "APAC,,40,,40",
      "EMEA,,10,50,60",
      ",France,10,20,30",
      ",Spain,,30,30",
      "Grand total,,50,50,100",
    ]);
  });
});
