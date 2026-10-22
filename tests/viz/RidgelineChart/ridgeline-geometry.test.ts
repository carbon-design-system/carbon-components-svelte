import { buildRidgeline } from "../../../src/viz/RidgelineChart/ridgeline-geometry.js";

type Row = { month: string; temp: number | null };
const rows: Row[] = [
  ...[2, 3, 4, 4, 5, 6].map((temp) => ({ month: "Jan", temp })),
  ...[18, 19, 20, 21, 22, 30].map((temp) => ({ month: "Jul", temp })),
  ...[10, 11, 12, 12, 13].map((temp) => ({ month: "Apr", temp })),
  { month: "Apr", temp: null },
];
const options = {
  x: (row: Row) => row.temp,
  series: (row: Row) => row.month,
  width: 400,
  rowHeight: 40,
  overlap: 0,
  points: 16,
};

describe("buildRidgeline", () => {
  test("lays a row per series in first-seen order, each baseline a row down, on one shared nice domain", () => {
    const ridge = buildRidgeline(rows, options);
    expect(ridge.rows.map((row) => row.key)).toEqual(["Jan", "Jul", "Apr"]);
    expect(ridge.rows.map((row) => row.y)).toEqual([40, 80, 120]);
    expect(ridge.height).toBe(160);
    // With an overlap, every row moves down by the room the first needs.
    const overlapping = buildRidgeline(rows, { ...options, overlap: 0.5 });
    expect(overlapping.rows.map((row) => row.y)).toEqual([60, 100, 140]);
    expect(overlapping.height).toBe(180);
    expect(ridge.domain[0]).toBeLessThan(2);
    expect(ridge.domain[1]).toBeGreaterThan(30);
    expect(ridge.ticks.length).toBeGreaterThan(2);
    expect(ridge.rows[2].count).toBe(5);
    expect(ridge.rows[2].median).toBe(12);
  });

  test("scales every curve to the same peak, rising into the row above by the overlap", () => {
    const ridge = buildRidgeline(rows, { ...options, overlap: 0.5 });
    for (const row of ridge.rows) {
      const ys =
        row.line.match(/,([\d.-]+)/g)?.map((m) => Number(m.slice(1))) ?? [];
      expect(Math.min(...ys)).toBeCloseTo(row.y - 60, 0);
      expect(Math.min(...ys)).toBeGreaterThanOrEqual(0);
      expect(Math.max(...ys)).toBeLessThanOrEqual(row.y + 0.01);
      expect(row.area).toMatch(/Z$/);
    }
    expect(ridge.rows[1].peak).toBeGreaterThan(17);
    expect(ridge.rows[1].peak).toBeLessThan(23);
  });

  test("orders by median when asked and colors by series or a fixed color", () => {
    const byMedian = buildRidgeline(rows, { ...options, order: "median" });
    expect(byMedian.rows.map((row) => row.key)).toEqual(["Jan", "Apr", "Jul"]);
    expect(byMedian.rows.map((row) => row.y)).toEqual([40, 80, 120]);
    expect(buildRidgeline(rows, options).rows[0].color).toBeUndefined();
    const colored = buildRidgeline(rows, {
      ...options,
      colorBy: "series",
      colors: { Jul: "error" },
    });
    expect(colored.rows[0].color).toMatch(/^var\(--cds-viz-/);
    expect(colored.rows[1].color).toBe("var(--cds-viz-error)");
  });

  test("survives a series with nothing to measure", () => {
    const ridge = buildRidgeline(
      [{ month: "Empty", temp: null }, ...rows],
      options,
    );
    expect(ridge.rows[0]).toMatchObject({
      key: "Empty",
      count: 0,
      line: "",
      area: "",
    });
    expect(ridge.rows).toHaveLength(4);
  });
});
