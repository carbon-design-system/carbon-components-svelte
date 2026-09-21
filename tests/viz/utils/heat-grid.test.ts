import { buildHeatGrid, heatColor } from "../../../src/viz/utils/heat-grid.js";

type Row = { day: string; block: string; n: number };

const rows: Row[] = [
  { day: "Mon", block: "AM", n: 0 },
  { day: "Tue", block: "AM", n: 10 },
  { day: "Mon", block: "PM", n: 4 },
  { day: "Tue", block: "PM", n: 3 },
  { day: "Tue", block: "PM", n: 3 },
  { day: "Wed", block: "AM", n: 5 },
];
const accessors = {
  x: (row: Row) => row.day,
  y: (row: Row) => row.block,
  value: (row: Row) => row.n,
};

describe("buildHeatGrid", () => {
  test("pivots rows into a grid in first-seen order, summing shared cells", () => {
    const grid = buildHeatGrid(rows, accessors);

    expect(grid.columns).toEqual(["Mon", "Tue", "Wed"]);
    expect(grid.rows.map((row) => row.key)).toEqual(["AM", "PM"]);
    expect(
      grid.rows.map((row) => row.cells.map((cell) => cell?.value ?? null)),
    ).toEqual([
      [0, 10, 5],
      [4, 6, null],
    ]);
    expect(grid.rows[1].cells[1]?.data).toHaveLength(2);
    expect([grid.min, grid.max]).toEqual([0, 10]);
  });

  test("colors from the low to the high end, with readable labels", () => {
    const grid = buildHeatGrid(rows, accessors);
    const [low, high] = [grid.rows[0].cells[0], grid.rows[0].cells[1]];

    expect(low?.color).toBe("var(--cds-viz-seq-blue-02)");
    expect(low?.textColor).toBe("var(--cds-viz-seq-on-02)");
    expect(high?.color).toBe("var(--cds-viz-seq-blue-11)");
    expect(high?.textColor).toBe("var(--cds-viz-seq-on-11)");
  });

  test("honors a fixed order and drops keys outside it", () => {
    const grid = buildHeatGrid(rows, {
      ...accessors,
      xOrder: ["Wed", "Mon", "Sun"],
      yOrder: ["PM", "AM"],
    });

    expect(grid.columns).toEqual(["Wed", "Mon", "Sun"]);
    expect(
      grid.rows.map((row) => row.cells.map((cell) => cell?.value ?? null)),
    ).toEqual([
      [null, 4, null],
      [5, 0, null],
    ]);
  });

  test("honors a fixed domain and skips non-finite values", () => {
    const grid = buildHeatGrid(
      [...rows, { day: "Wed", block: "PM", n: Number.NaN }],
      { ...accessors, domain: [0, 100] },
    );

    expect(grid.rows[1].cells[2]).toBeNull();
    expect(grid.rows[0].cells[1]?.color).toBe("var(--cds-viz-seq-blue-03)");
    expect(grid.domain).toEqual([0, 100]);
  });

  test("is empty for no rows", () => {
    expect(buildHeatGrid([], accessors)).toEqual({
      columns: [],
      rows: [],
      min: 0,
      max: 0,
      domain: [0, 0],
    });
  });
});

describe("heatColor", () => {
  test("centers a diverging palette on the middle of the domain", () => {
    expect(heatColor(0, [-1, 1], "red-cyan")).toEqual({
      color: "var(--cds-viz-div-red-cyan-09)",
      textColor: "var(--cds-viz-div-on-09)",
    });
    expect(heatColor(-1, [-1, 1], "red-cyan")).toEqual({
      color: "var(--cds-viz-div-red-cyan-01)",
      textColor: "var(--cds-viz-div-on-01)",
    });
    expect(heatColor(5, [-1, 1], "purple-teal").color).toBe(
      "var(--cds-viz-div-purple-teal-17)",
    );
  });

  test("uses the top of the ramp for a flat domain", () => {
    expect(heatColor(3, [3, 3], "teal").color).toBe(
      "var(--cds-viz-seq-teal-11)",
    );
  });
});
