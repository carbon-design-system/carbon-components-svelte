import {
  buildBars,
  stackedExtent,
} from "../../../src/viz/Chart/bar-geometry.js";
import {
  buildGroups,
  buildScales,
  resolveDomain,
} from "../../../src/viz/Chart/model.js";

type Row = { q: string; s: string; v: number | null };

function setup(rows: Row[], include: number[] = [], hidden: string[] = []) {
  const built = buildGroups(rows, {
    x: (row) => row.q,
    y: (row) => row.v,
    series: (row) => row.s,
    hidden,
  });
  const scales = buildScales(resolveDomain(built, { include }), {
    width: 440,
    height: 240,
  });
  return { groups: built.groups, scales };
}

const rows: Row[] = [
  { q: "Q1", s: "a", v: 10 },
  { q: "Q2", s: "a", v: 20 },
  { q: "Q1", s: "b", v: 30 },
  { q: "Q2", s: "b", v: -10 },
];

describe("buildBars", () => {
  test("returns nothing without categorical slots", () => {
    const built = buildGroups([{ x: 1, v: 2 }], {
      x: (row) => row.x,
      y: (row) => row.v,
      series: () => "s",
    });
    const scales = buildScales(resolveDomain(built, {}), {
      width: 400,
      height: 200,
    });

    expect(buildBars(built.groups, scales)).toEqual([]);
  });

  test("grouped: series sit side by side, centered on the slot, growing from zero", () => {
    const { groups, scales } = setup(rows);
    const bars = buildBars(groups, scales, { maxBarWidth: 1000 });
    const zero = scales.y.map(0);
    const [a1, , b1] = bars;

    expect(bars).toHaveLength(4);
    expect(a1.x + a1.width).toBeLessThanOrEqual(b1.x);
    const middle = (a1.x + b1.x + b1.width) / 2;
    expect(middle).toBeCloseTo(scales.x.map(0));
    expect(a1.y + a1.height).toBeCloseTo(zero);
    expect(a1.height).toBeCloseTo(zero - scales.y.map(10));
  });

  test("a negative value hangs below the zero line", () => {
    const { groups, scales } = setup(rows);
    const negative = buildBars(groups, scales).find((bar) => bar.value === -10);

    expect(negative?.y).toBeCloseTo(scales.y.map(0));
    expect(negative?.height).toBeCloseTo(scales.y.map(-10) - scales.y.map(0));
  });

  test("stacked: series pile up in one lane, negatives below zero", () => {
    const { groups, scales } = setup(rows, stackedExtent(setup(rows).groups));
    const bars = buildBars(groups, scales, { mode: "stacked" });
    const a1 = bars.find((bar) => bar.series === "a" && bar.slot === 0);
    const b1 = bars.find((bar) => bar.series === "b" && bar.slot === 0);

    expect(a1?.x).toBe(b1?.x);
    expect(b1 && b1.y + b1.height).toBeCloseTo(a1?.y ?? Number.NaN);
    expect(b1?.y).toBeCloseTo(scales.y.map(40));
  });

  test("normalized: positive values in a slot fill it from 0 to 1", () => {
    const built = buildGroups(rows, {
      x: (row) => row.q,
      y: (row) => row.v,
      series: (row) => row.s,
    });
    const scales = buildScales(resolveDomain(built, { yDomain: [0, 1] }), {
      width: 440,
      height: 240,
    });
    const slot0 = buildBars(built.groups, scales, {
      mode: "normalized",
    }).filter((bar) => bar.slot === 0);
    const total = slot0.reduce((sum, bar) => sum + bar.height, 0);

    expect(total).toBeCloseTo(scales.y.map(0) - scales.y.map(1));
    expect(slot0[0].height / total).toBeCloseTo(0.25);
    expect(slot0[0].value).toBe(10);
  });

  test("skips hidden series and missing values, and caps the bar width", () => {
    const { groups, scales } = setup(
      [...rows, { q: "Q3", s: "a", v: null }],
      [],
      ["b"],
    );
    const bars = buildBars(groups, scales, { maxBarWidth: 12 });

    expect(bars.map((bar) => bar.series)).toEqual(["a", "a"]);
    expect(bars.every((bar) => bar.width === 12)).toBe(true);
  });

  test("keys stay stable for a series and datum", () => {
    const { groups, scales } = setup(rows);

    expect(buildBars(groups, scales).map((bar) => bar.key)).toEqual([
      "a:0",
      "a:1",
      "b:0",
      "b:1",
    ]);
  });
});

describe("stackedExtent", () => {
  test("is the tallest positive and negative pile, ignoring hidden series", () => {
    expect(stackedExtent(setup(rows).groups)).toEqual([-10, 40]);
    expect(stackedExtent(setup(rows, [], ["b"]).groups)).toEqual([0, 20]);
    expect(stackedExtent([])).toEqual([0, 0]);
  });
});
