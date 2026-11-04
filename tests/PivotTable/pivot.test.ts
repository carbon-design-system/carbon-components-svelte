// @vitest-environment node
import { pivot } from "../../src/PivotTable/pivot.js";
import type { PivotConfig, PivotResult } from "../../src/PivotTable/pivot.js";

type Sale = {
  region: string | null;
  country: string;
  year: number;
  amount: number | null;
};

const sales: Sale[] = [
  { region: "EMEA", country: "France", year: 2023, amount: 10 },
  { region: "EMEA", country: "France", year: 2024, amount: 20 },
  { region: "EMEA", country: "Spain", year: 2024, amount: 30 },
  { region: "APAC", country: "Japan", year: 2023, amount: 40 },
  { region: "APAC", country: "Japan", year: 2024, amount: 50 },
  { region: null, country: "Chile", year: 2023, amount: null },
];

const find = (nodes: PivotResult["rowNodes"], label: string) => {
  const node = nodes.find((n) => n.label === label);
  if (!node) throw new Error(`no node ${label}`);
  return node;
};

describe("pivot", () => {
  const config: PivotConfig = {
    rows: ["region", "country"],
    columns: ["year"],
    values: [{ field: "amount", aggregate: "sum" }],
  };

  it("sums every group, subtotal and grand total", () => {
    const result = pivot(sales, config);
    const emea = find(result.rowNodes, "EMEA");
    const france = find(result.rowNodes, "France");
    const y2024 = find(result.columnNodes, "2024");
    expect(result.get(france, y2024)).toBe(20);
    expect(result.get(emea, y2024)).toBe(50);
    expect(result.get(emea, result.columnRoot)).toBe(60);
    expect(result.get(result.rowRoot, y2024)).toBe(100);
    expect(result.get(result.rowRoot, result.columnRoot)).toBe(150);
  });

  it("returns null where no record falls", () => {
    const result = pivot(sales, config);
    expect(
      result.get(
        find(result.rowNodes, "Spain"),
        find(result.columnNodes, "2023"),
      ),
    ).toBeNull();
  });

  it("groups missing values as blank and sorts them last", () => {
    const result = pivot(sales, config, { blankLabel: "(none)" });
    const labels = result.rowRoot.children.map((n) => n.label);
    expect(labels).toEqual(["APAC", "EMEA", "(none)"]);
    expect(result.rowRoot.children[2]).toMatchObject({
      blank: true,
      key: null,
    });
  });

  it("orders groups by label, numbers numerically", () => {
    const result = pivot(
      [{ n: 10 }, { n: 9 }, { n: 100 }, { n: "b" }, { n: "a" }],
      { rows: ["n"] },
    );
    expect(result.rowRoot.children.map((n) => n.label)).toEqual([
      "9",
      "10",
      "100",
      "a",
      "b",
    ]);
  });

  it("orders groups by an aggregate", () => {
    const result = pivot(sales, {
      ...config,
      rows: [{ field: "region", sort: { by: "value", direction: "desc" } }],
    });
    // null region has a null sum and goes last.
    expect(result.rowRoot.children.map((n) => n.label)).toEqual([
      "APAC",
      "EMEA",
      "(blank)",
    ]);
  });

  it("applies include and exclude filters, on fields not shown too", () => {
    const result = pivot(sales, {
      ...config,
      filters: [
        { field: "region", include: ["EMEA", null] },
        { field: "country", exclude: ["Spain"] },
      ],
    });
    expect(result.recordCount).toBe(3);
    expect(result.get(result.rowRoot, result.columnRoot)).toBe(30);
    expect(result.rowRoot.children.map((n) => n.label)).toEqual([
      "EMEA",
      "(blank)",
    ]);
  });

  it("computes several values side by side", () => {
    const result = pivot(sales, {
      rows: ["region"],
      values: [
        { field: "amount", aggregate: "sum" },
        { field: "amount", aggregate: "avg" },
        { field: "amount", aggregate: "min" },
        { field: "amount", aggregate: "max" },
        { field: "amount", aggregate: "count" },
        { field: "country", aggregate: "countDistinct" },
        { aggregate: "count", label: "Records" },
      ],
    });
    const emea = find(result.rowNodes, "EMEA");
    const at = (v: number) => result.get(emea, result.columnRoot, v);
    expect([0, 1, 2, 3, 4, 5, 6].map(at)).toEqual([60, 20, 10, 30, 3, 2, 3]);
    // A blank amount is not counted, but its record is.
    const blank = find(result.rowNodes, "(blank)");
    expect(result.get(blank, result.columnRoot, 4)).toBeNull();
    expect(result.get(blank, result.columnRoot, 6)).toBe(1);
    expect(result.values.map((v) => v.label)).toEqual([
      "Sum of amount",
      "Avg of amount",
      "Min of amount",
      "Max of amount",
      "Count of amount",
      "Distinct count of country",
      "Records",
    ]);
  });

  it("averages a subtotal from its records, not from child averages", () => {
    const result = pivot(
      [
        { g: "a", s: "x", v: 1 },
        { g: "a", s: "y", v: 2 },
        { g: "a", s: "y", v: 6 },
      ],
      { rows: ["g", "s"], values: [{ field: "v", aggregate: "avg" }] },
    );
    expect(result.get(find(result.rowNodes, "y"), result.columnRoot)).toBe(4);
    expect(result.get(find(result.rowNodes, "a"), result.columnRoot)).toBe(3);
  });

  it("counts distinct values across a subtotal once", () => {
    const result = pivot(
      [
        { g: "a", s: "x", c: "p" },
        { g: "a", s: "y", c: "p" },
        { g: "a", s: "y", c: "q" },
      ],
      {
        rows: ["g", "s"],
        values: [{ field: "c", aggregate: "countDistinct" }],
      },
    );
    expect(result.get(find(result.rowNodes, "a"), result.columnRoot)).toBe(2);
    expect(result.get(result.rowRoot, result.columnRoot)).toBe(2);
  });

  it("runs a custom aggregate over every record under a node", () => {
    const calls: number[][] = [];
    const result = pivot(sales, {
      rows: ["region"],
      values: [
        {
          field: "amount",
          aggregate: (values) => {
            calls.push(values);
            return Math.max(...values) - Math.min(...values);
          },
        },
      ],
    });
    expect(result.get(find(result.rowNodes, "EMEA"), result.columnRoot)).toBe(
      20,
    );
    expect(result.get(result.rowRoot, result.columnRoot)).toBe(40);
    // Blank amounts are removed before the call.
    expect(calls.every((values) => !values.includes(null as never))).toBe(true);
  });

  it("groups by a derived value and labels it", () => {
    const result = pivot(sales, {
      rows: [
        {
          field: "year",
          group: (year: number) => (year < 2024 ? "before" : "since"),
          formatKey: (key: string) => key.toUpperCase(),
        },
      ],
      values: [{ field: "amount" }],
    });
    expect(result.rowRoot.children.map((n) => n.label)).toEqual([
      "BEFORE",
      "SINCE",
    ]);
  });

  it("reads dotted field paths", () => {
    const result = pivot([{ a: { b: "x" } }, { a: {} }], { rows: ["a.b"] });
    expect(result.rowRoot.children.map((n) => n.label)).toEqual([
      "x",
      "(blank)",
    ]);
  });

  it("works with no row or column fields", () => {
    const result = pivot(sales, { values: [{ field: "amount" }] });
    expect(result.get(result.rowRoot, result.columnRoot)).toBe(150);
    expect(result.rowRoot.children).toEqual([]);
  });

  it("gives ids that survive a data change", () => {
    const before = pivot(sales, config);
    const after = pivot(sales.slice(0, 3), config);
    const id = (r: PivotResult) => find(r.rowNodes, "France").id;
    expect(id(before)).toBe(id(after));
    expect(id(before)).not.toBe(find(before.rowNodes, "EMEA").id);
  });

  it("lists the records behind a cell and a subtotal", () => {
    const result = pivot(sales, config);
    const emea = find(result.rowNodes, "EMEA");
    expect(
      result
        .records(emea, find(result.columnNodes, "2024"))
        .map((r) => r.amount),
    ).toEqual([20, 30]);
    expect(result.records(result.rowRoot, result.columnRoot)).toHaveLength(6);
    expect(
      result.records(
        find(result.rowNodes, "Spain"),
        find(result.columnNodes, "2023"),
      ),
    ).toEqual([]);
  });

  it("rejects a pivot larger than maxCells", () => {
    expect(() => pivot(sales, config, { maxCells: 10 })).toThrow(RangeError);
  });

  it("rejects an unknown aggregate", () => {
    expect(() =>
      pivot(sales, {
        values: [{ field: "amount", aggregate: "median" as never }],
      }),
    ).toThrow(/unknown aggregate/);
  });
});
