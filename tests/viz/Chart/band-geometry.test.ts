import {
  bandExtent,
  buildBands,
} from "../../../src/viz/Chart/band-geometry.js";
import {
  buildGroups,
  buildScales,
  resolveDomain,
} from "../../../src/viz/Chart/model.js";

type Row = { day: number; value: number; lo: number | null; hi: number | null };

const rows: Row[] = [
  { day: 0, value: 10, lo: 8, hi: 12 },
  { day: 1, value: 20, lo: 15, hi: 26 },
  { day: 2, value: 30, lo: null, hi: 40 },
  { day: 3, value: 40, lo: 30, hi: 55 },
  { day: 4, value: 50, lo: 35, hi: 70 },
];
const lo = (row: Row) => row.lo;
const hi = (row: Row) => row.hi;

function setup(orientation: "vertical" | "horizontal" = "vertical") {
  const built = buildGroups(rows, {
    x: (row) => row.day,
    y: (row) => row.value,
    series: () => "s",
  });
  const domain = resolveDomain(built, { include: [8, 70] });
  const scales = buildScales(
    domain,
    { width: 400, height: 200 },
    { orientation },
  );
  return { groups: built.groups, scales };
}

describe("bandExtent", () => {
  test("spans the lowest lower and the highest upper, skipping half-missing data", () => {
    const { groups } = setup();
    expect(bandExtent(groups, lo, hi)).toEqual([8, 70]);
  });

  test("is null with nothing to measure", () => {
    const { groups } = setup();
    expect(bandExtent(groups, () => null, hi)).toBeNull();
    expect(bandExtent([{ ...groups[0], hidden: true }], lo, hi)).toBeNull();
  });
});

describe("buildBands", () => {
  test("draws one closed path per series, broken where a bound is missing", () => {
    const { groups, scales } = setup();
    const bands = buildBands(groups, scales, { lower: lo, upper: hi });
    expect(bands).toHaveLength(1);
    expect(bands[0].key).toBe("s");
    // Two runs: days 0-1 and days 3-4. Day 2 has no lower bound.
    expect(bands[0].d.match(/Z/g)).toHaveLength(2);
    expect(bands[0].d.match(/M/g)).toHaveLength(2);
  });

  test("on a horizontal chart the band runs down the plot", () => {
    const { groups, scales } = setup("horizontal");
    const bands = buildBands(groups, scales, { lower: lo, upper: hi });
    const [first] = bands[0].d.slice(1).split("L");
    const [px, py] = first.split(",").map(Number);
    // Day 0 sits at the top of the plot; its upper bound is a pixel x.
    expect(py).toBeCloseTo(scales.x.map(0), 0);
    expect(px).toBeCloseTo(scales.y.map(12), 0);
  });

  test("skips hidden series", () => {
    const { groups, scales } = setup();
    expect(
      buildBands([{ ...groups[0], hidden: true }], scales, {
        lower: lo,
        upper: hi,
      }),
    ).toEqual([]);
  });
});
