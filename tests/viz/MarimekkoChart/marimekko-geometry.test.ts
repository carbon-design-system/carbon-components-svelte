import { buildMarimekko } from "../../../src/viz/MarimekkoChart/marimekko-geometry.js";

type Row = { segment: string; vendor: string; share: number; size?: number };
const rows: Row[] = [
  { segment: "Enterprise", vendor: "Acme", share: 60, size: 300 },
  { segment: "Enterprise", vendor: "Beta", share: 40, size: 300 },
  { segment: "Mid-market", vendor: "Acme", share: 25, size: 100 },
  { segment: "Mid-market", vendor: "Beta", share: 50, size: 100 },
  { segment: "Mid-market", vendor: "Ce", share: 25, size: 100 },
];
const options = {
  x: (row: Row) => row.segment,
  y: (row: Row) => row.share,
  series: (row: Row) => row.vendor,
  width: 402,
  height: 100,
};

describe("buildMarimekko", () => {
  test("widens each column by its total and stacks cells by share of the column", () => {
    const m = buildMarimekko(rows, options);
    expect(m.columns.map((c) => c.key)).toEqual(["Enterprise", "Mid-market"]);
    // Totals 100 and 100, so the 400px of usable width split evenly.
    expect(m.columns[0]).toMatchObject({ x0: 0, x1: 200, share: 0.5 });
    expect(m.columns[1]).toMatchObject({ x0: 202, x1: 402 });
    expect(m.columns[0].cells.map((c) => [c.key, c.y0, c.y1])).toEqual([
      ["Acme", 0, 60],
      ["Beta", 60, 100],
    ]);
    expect(m.columns[1].cells.map((c) => c.share)).toEqual([0.25, 0.5, 0.25]);
    expect(m.series.map((s) => s.key)).toEqual(["Acme", "Beta", "Ce"]);
    expect(m.total).toBe(200);
  });

  test("takes the column size from a field when given, and sorts largest first when asked", () => {
    const m = buildMarimekko(rows, {
      ...options,
      xValue: (row) => row.size,
      sort: "value",
    });
    expect(m.columns[0]).toMatchObject({
      key: "Enterprise",
      share: 0.75,
      x1: 300,
    });
    expect(m.columns[1]).toMatchObject({ key: "Mid-market", x0: 302, x1: 402 });
    const sorted = buildMarimekko([...rows].reverse(), {
      ...options,
      xValue: (row) => row.size,
      sort: "value",
    });
    expect(sorted.columns.map((c) => c.key)).toEqual([
      "Enterprise",
      "Mid-market",
    ]);
    expect(sorted.columns[0].cells.map((c) => c.key)).toEqual(["Beta", "Acme"]);
  });

  test("keeps a series the same color in every column and honors fixed colors", () => {
    const m = buildMarimekko(rows, { ...options, colors: { Beta: "warning" } });
    const beta = (i: number) =>
      m.columns[i].cells.find((c) => c.key === "Beta");
    expect(beta(0)?.color).toBe("var(--cds-viz-warning)");
    expect(beta(1)?.color).toBe("var(--cds-viz-warning)");
    expect(m.columns[0].cells[0].color).not.toBe(beta(0)?.color);
  });

  test("treats a negative or missing value as nothing and survives an empty column", () => {
    const m = buildMarimekko(
      [
        { segment: "A", vendor: "x", share: -5 },
        { segment: "A", vendor: "y", share: 5 },
        { segment: "B", vendor: "x", share: Number.NaN },
      ],
      options,
    );
    expect(m.columns[0].cells.map((c) => c.share)).toEqual([0, 1]);
    expect(m.columns[1]).toMatchObject({
      total: 0,
      share: 0,
      x0: 402,
      x1: 402,
    });
  });
});
