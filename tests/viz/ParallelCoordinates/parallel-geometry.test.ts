import {
  buildParallel,
  nearestLine,
  passesBrushes,
} from "../../../src/viz/ParallelCoordinates/parallel-geometry.js";

type Row = {
  name: string;
  tier: string;
  cpu: number;
  mem: number | null;
  cost: number;
};

const rows: Row[] = [
  { name: "a", tier: "small", cpu: 10, mem: 4, cost: 20 },
  { name: "b", tier: "small", cpu: 30, mem: 8, cost: 45 },
  { name: "c", tier: "large", cpu: 90, mem: null, cost: 200 },
];
const plot = { x0: 40, x1: 340, y0: 20, y1: 220 };
const options = {
  dimensions: [
    "cpu",
    "mem",
    { key: "cost", label: "Cost", domain: [0, 250] as const },
  ],
  series: (row: Row) => row.tier,
  label: (row: Row) => row.name,
  plot,
};

describe("buildParallel", () => {
  test("spaces one axis per dimension, each on its own rounded-out scale", () => {
    const built = buildParallel(rows, options);
    expect(built.axes.map((axis) => axis.x)).toEqual([40, 190, 340]);
    expect(built.axes.map((axis) => axis.label)).toEqual([
      "cpu",
      "mem",
      "Cost",
    ]);
    expect(built.axes[0].domain).toEqual([0, 100]);
    expect(built.axes[1].domain).toEqual([4, 8]);
    expect(built.axes[2].domain).toEqual([0, 250]);
    expect(built.axes[0].scale.map(0)).toBe(220);
    expect(built.axes[0].scale.map(100)).toBe(20);
    expect(built.axes[0].ticks.map((tick) => tick.value)).toEqual([0, 50, 100]);
  });

  test("draws one line per row, colored by series, with a gap where a value is missing", () => {
    const built = buildParallel(rows, options);
    expect(built.lines).toHaveLength(3);
    expect(built.lines[0].label).toBe("a");
    expect(built.lines[0].d).toMatch(/^M40,200L190,220L340,204$/);
    expect(built.lines[2].points[1]).toBeNull();
    expect(built.lines[2].d).toBe("M40,40l0,0M340,60l0,0");
    expect(built.lines[0].color).toBe(built.lines[1].color);
    expect(built.lines[0].color).not.toBe(built.lines[2].color);
    expect(built.series.map((entry) => entry.key)).toEqual(["small", "large"]);
  });

  test("marks the lines of a hidden series", () => {
    const built = buildParallel(rows, { ...options, hidden: ["large"] });
    expect(built.lines.map((line) => line.hidden)).toEqual([
      false,
      false,
      true,
    ]);
    expect(built.series[1].hidden).toBe(true);
  });
});

describe("passesBrushes", () => {
  test("keeps a row inside every range and drops one missing a brushed value", () => {
    expect(passesBrushes([10, 4, 20], [{ index: 0, range: [0, 50] }])).toBe(
      true,
    );
    expect(passesBrushes([10, 4, 20], [{ index: 0, range: [50, 0] }])).toBe(
      true,
    );
    expect(passesBrushes([90, 4, 20], [{ index: 0, range: [0, 50] }])).toBe(
      false,
    );
    expect(
      passesBrushes([10, Number.NaN, 20], [{ index: 1, range: [0, 10] }]),
    ).toBe(false);
    expect(passesBrushes([10, 4, 20], [])).toBe(true);
  });
});

describe("nearestLine", () => {
  test("picks the line closest to the pointer on the segment it is over", () => {
    const built = buildParallel(rows, options);
    const lines = built.lines.map((line) => ({ ...line, kept: true }));
    // Halfway between the cpu and mem axes, near line a.
    expect(nearestLine(lines, built.axes, 115, 209)).toBe(0);
    expect(nearestLine(lines, built.axes, 115, 150)).toBe(-1);
    // Line c has no mem value, so it is never picked on that segment.
    expect(nearestLine(lines, built.axes, 115, 40)).toBe(-1);
    expect(
      nearestLine([{ ...lines[0], hidden: true }], built.axes, 115, 209),
    ).toBe(-1);
  });
});
