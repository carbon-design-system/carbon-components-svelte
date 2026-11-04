// @vitest-environment node
import {
  groupIds,
  layoutPivot,
  pivotToCsv,
} from "../../src/PivotTable/pivot-layout.js";
import { pivot } from "../../src/PivotTable/pivot.js";

const records = [
  {
    region: "EMEA",
    country: "France",
    year: 2023,
    q: "Q1",
    amount: 10,
    units: 1,
  },
  {
    region: "EMEA",
    country: "France",
    year: 2024,
    q: "Q2",
    amount: 20,
    units: 2,
  },
  {
    region: "EMEA",
    country: "Spain",
    year: 2024,
    q: "Q1",
    amount: 30,
    units: 3,
  },
  {
    region: "APAC",
    country: "Japan",
    year: 2023,
    q: "Q1",
    amount: 40,
    units: 4,
  },
  {
    region: "=SUM(A1)",
    country: "X",
    year: 2023,
    q: "Q1",
    amount: -5,
    units: 5,
  },
];

const result = pivot(records, {
  rows: ["region", "country"],
  columns: ["year", "q"],
  values: [{ field: "amount" }],
});
const id = (label: string, nodes = result.rowNodes) =>
  nodes.find((n) => n.label === label)?.id ?? "";

describe("layoutPivot rows", () => {
  it("shows only the outermost groups and the grand total when collapsed", () => {
    const layout = layoutPivot(result);
    expect(layout.rows.map((r) => [r.label, r.kind, r.level])).toEqual([
      ["=SUM(A1)", "group", 0],
      ["APAC", "group", 0],
      ["EMEA", "group", 0],
      ["Grand total", "grand", 0],
    ]);
  });

  it("inserts the children of an open group, with tree positions", () => {
    const layout = layoutPivot(result, {
      expandedRowIds: new Set([id("EMEA")]),
    });
    const rows = layout.rows.map((r) => r.label);
    expect(rows).toEqual([
      "=SUM(A1)",
      "APAC",
      "EMEA",
      "France",
      "Spain",
      "Grand total",
    ]);
    const france = layout.rows[3];
    expect(france).toMatchObject({
      level: 1,
      posInSet: 1,
      setSize: 2,
      kind: "leaf",
    });
    expect(layout.rows[2]).toMatchObject({ expanded: true, expandable: true });
    // The grand total is one more sibling of the outermost groups.
    expect(layout.rows[0]).toMatchObject({ posInSet: 1, setSize: 4 });
    expect(layout.rows.at(-1)).toMatchObject({ posInSet: 4, setSize: 4 });
  });

  it("ignores ids that are not groups", () => {
    const layout = layoutPivot(result, {
      expandedRowIds: new Set([id("France"), "nope"]),
    });
    expect(layout.rows).toHaveLength(4);
  });

  it("drops the grand total on request", () => {
    const layout = layoutPivot(result, { grandTotals: false });
    expect(layout.rows.map((r) => r.kind)).not.toContain("grand");
    expect(layout.columns.map((c) => c.kind)).not.toContain("grand");
  });

  it("lists every group id, outermost first", () => {
    expect(groupIds(result.rowRoot)).toEqual(
      result.rowRoot.children.flatMap((n) => [n.id]),
    );
    expect(groupIds(result.columnRoot)).toHaveLength(2);
  });
});

describe("layoutPivot headers", () => {
  it("spans a collapsed group down every header row", () => {
    const layout = layoutPivot(result);
    expect(layout.headerRowCount).toBe(1);
    const cells = layout.headerRows[0].map((c) => [
      c.text,
      c.rowSpan,
      c.colSpan,
    ]);
    expect(cells).toEqual([
      ["region / country", 1, 1],
      ["2023", 1, 1],
      ["2024", 1, 1],
      ["Grand total", 1, 1],
    ]);
  });

  it("adds a header row and a subtotal column for an open group", () => {
    const layout = layoutPivot(result, {
      expandedColumnIds: new Set([id("2024", result.columnNodes)]),
    });
    expect(layout.headerRowCount).toBe(2);
    const [top, bottom] = layout.headerRows.map((cells) =>
      cells.map((c) => [c.text, c.col, c.rowSpan, c.colSpan]),
    );
    expect(top).toEqual([
      ["region / country", 0, 2, 1],
      ["2023", 1, 2, 1],
      // Two quarters and the subtotal.
      ["2024", 2, 1, 3],
      ["Grand total", 5, 2, 1],
    ]);
    expect(bottom).toEqual([
      ["Q1", 2, 1, 1],
      ["Q2", 3, 1, 1],
      ["2024 total", 4, 1, 1],
    ]);
    expect(layout.columns.map((c) => c.kind)).toEqual([
      "node",
      "node",
      "node",
      "subtotal",
      "grand",
    ]);
    expect(layout.columnCount).toBe(6);
  });

  it("finds the header cell that covers a position", () => {
    const layout = layoutPivot(result, {
      expandedColumnIds: new Set([id("2024", result.columnNodes)]),
    });
    expect(layout.headerCellAt(1, 0).text).toBe("region / country");
    expect(layout.headerCellAt(1, 1).text).toBe("2023");
    expect(layout.headerCellAt(0, 4).text).toBe("2024");
    expect(layout.headerCellAt(1, 4).text).toBe("2024 total");
  });

  it("adds a value row for several values and drops rows no cell starts in", () => {
    const two = pivot(records, {
      rows: ["region"],
      columns: ["year", "q"],
      values: [{ field: "amount" }, { field: "units", aggregate: "avg" }],
    });
    const layout = layoutPivot(two);
    // Both column levels are collapsed, so the quarter row has no cell.
    expect(layout.headerRowCount).toBe(2);
    expect(layout.headerRows[1].map((c) => [c.kind, c.text, c.value])).toEqual([
      ["value", "Sum of amount", 0],
      ["value", "Avg of units", 1],
      ["value", "Sum of amount", 0],
      ["value", "Avg of units", 1],
      ["value", "Sum of amount", 0],
      ["value", "Avg of units", 1],
    ]);
    expect(layout.headerRows[0][1]).toMatchObject({
      text: "2023",
      rowSpan: 1,
      colSpan: 2,
    });
    expect(layout.headerRows[0][0]).toMatchObject({ rowSpan: 2 });
  });

  it("has one grand column and row without fields", () => {
    const layout = layoutPivot(
      pivot(records, { values: [{ field: "amount" }] }),
    );
    expect(layout.rows.map((r) => r.label)).toEqual(["Grand total"]);
    expect(layout.columns).toHaveLength(1);
    expect(layout.headerRows[0].map((c) => [c.text, c.col])).toEqual([
      ["", 0],
      ["Grand total", 1],
    ]);
  });

  it("does not call pivot again for the same result", () => {
    const rows = layoutPivot(result, { expandedRowIds: new Set([id("EMEA")]) });
    const same = layoutPivot(result, { expandedRowIds: new Set([id("EMEA")]) });
    expect(same.rows.map((r) => r.node)).toEqual(rows.rows.map((r) => r.node));
    // Nodes are shared with the result, so a layout allocates no aggregates.
    expect(rows.rows[2].node).toBe(
      result.rowNodes.find((n) => n.label === "EMEA"),
    );
  });
});

describe("pivotToCsv", () => {
  const layout = layoutPivot(result, {
    expandedRowIds: new Set([id("EMEA")]),
  });

  it("writes header lines, one label column per row field, raw numbers", () => {
    const lines = pivotToCsv(result, layout).split("\r\n");
    expect(lines[0]).toBe("region,country,2023,2024,Grand total");
    expect(lines).toContain("EMEA,,10,50,60");
    expect(lines).toContain(",France,10,20,30");
    expect(lines.at(-1)).toBe("Grand total,,45,50,95");
  });

  it("leaves an empty cell empty and marks a formula-like label", () => {
    const text = pivotToCsv(result, layout);
    expect(text).toContain("'=SUM(A1),,-5,,-5");
    expect(text).toContain(",Spain,,30,30");
  });

  it("formats numbers on request", () => {
    const big = pivot([{ g: "a", v: 1234.5 }], {
      rows: ["g"],
      values: [{ field: "v", format: { style: "currency", currency: "USD" } }],
    });
    const csv = pivotToCsv(big, layoutPivot(big), { formatted: true });
    expect(csv).toContain('"$1,234.50"');
    expect(pivotToCsv(big, layoutPivot(big))).toContain("1234.5");
  });
});
