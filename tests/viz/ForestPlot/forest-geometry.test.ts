import { buildForest } from "../../../src/viz/ForestPlot/forest-geometry.js";

type Row = { study: string; or: number; lo: number; hi: number; n?: number };
const rows: Row[] = [
  { study: "North", or: 1.12, lo: 0.91, hi: 1.38, n: 400 },
  { study: "South", or: 0.94, lo: 0.8, hi: 1.1, n: 900 },
  { study: "EU", or: 1.21, lo: 0.99, hi: 1.48, n: 300 },
];
const options = {
  label: (row: Row) => row.study,
  estimate: (row: Row) => row.or,
  lo: (row: Row) => row.lo,
  hi: (row: Row) => row.hi,
  plotWidth: 200,
  rowHeight: 20,
};

describe("buildForest", () => {
  test("places a row per study on a nice linear scale holding every interval and the null", () => {
    const forest = buildForest(rows, { ...options, nullValue: 1 });
    expect(forest.rows.map((row) => row.y)).toEqual([10, 30, 50]);
    expect(forest.domain[0]).toBeLessThanOrEqual(0.8);
    expect(forest.domain[1]).toBeGreaterThanOrEqual(1.48);
    const north = forest.rows[0];
    expect(north.x0).toBeLessThan(north.x);
    expect(north.x).toBeLessThan(north.x1);
    expect(forest.nullX).toBeGreaterThan(0);
    expect(forest.rows.map((row) => row.clear)).toEqual([false, false, false]);
    expect(forest.height).toBe(60);
    expect(forest.overall).toBeNull();
    expect(forest.log).toBe(false);
  });

  test("adds the pooled diamond in a row of its own and marks a clear interval", () => {
    const forest = buildForest(rows, {
      ...options,
      nullValue: 1,
      overall: { estimate: 1.06, lo: 1.01, hi: 1.16 },
    });
    expect(forest.overall?.label).toBe("Overall");
    expect(forest.overall?.y).toBe(70);
    expect(forest.overall?.d).toMatch(
      /^M[\d.]+,70L[\d.]+,64L[\d.]+,70L[\d.]+,76Z$/,
    );
    expect(forest.overall?.clear).toBe(true);
    expect(forest.height).toBe(80);
  });

  test("uses a log scale with power ticks when asked and the domain allows it", () => {
    const forest = buildForest(rows, {
      ...options,
      scale: "log",
      nullValue: 1,
    });
    expect(forest.log).toBe(true);
    expect(forest.domain).toEqual([0.1, 10]);
    expect(forest.ticks.map((tick) => tick.value)).toContain(1);
    expect(forest.nullX).toBeCloseTo(100);
    const around = buildForest(rows, {
      ...options,
      scale: "log",
      nullValue: 0,
    });
    expect(around.log).toBe(false);
  });

  test("sizes markers by weight and drops a row without an estimate", () => {
    const forest = buildForest(
      [...rows, { study: "Missing", or: Number.NaN, lo: 0, hi: 1 }],
      { ...options, weight: (row) => row.n, markerSize: [4, 12] },
    );
    expect(forest.rows).toHaveLength(3);
    expect(forest.rows[1].size).toBe(12);
    expect(forest.rows[2].size).toBe(4);
    expect(forest.rows[0].size).toBeCloseTo(4 + (100 / 600) * 8);
  });
});
