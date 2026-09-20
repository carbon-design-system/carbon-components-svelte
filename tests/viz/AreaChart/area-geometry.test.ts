import {
  areaExtent,
  buildAreas,
} from "../../../src/viz/Chart/area-geometry.js";
import {
  buildGroups,
  buildScales,
  resolveDomain,
} from "../../../src/viz/Chart/model.js";

type Row = { x: number; s: string; v: number | null };

const rows: Row[] = [
  { x: 0, s: "a", v: 10 },
  { x: 1, s: "a", v: 20 },
  { x: 2, s: "a", v: 30 },
  { x: 0, s: "b", v: 30 },
  { x: 1, s: "b", v: 20 },
  { x: 2, s: "b", v: 10 },
];

function setup(data: Row[], yDomain?: [number, number], hidden: string[] = []) {
  const built = buildGroups(data, {
    x: (row) => row.x,
    y: (row) => row.v,
    series: (row) => row.s,
    hidden,
  });
  const scales = buildScales(
    resolveDomain(built, { yDomain: yDomain ?? [0, 40] }),
    { width: 440, height: 240 },
  );
  return { groups: built.groups, scales };
}

const subpaths = (d: string) => d.match(/M/g)?.length ?? 0;

describe("areaExtent", () => {
  test("is the tallest stack, centered for a stream, and null otherwise", () => {
    const { groups } = setup(rows);

    expect(areaExtent(groups, "stacked")).toEqual([0, 40]);
    expect(areaExtent(groups, "stream")).toEqual([-20, 20]);
    expect(areaExtent(groups, "none")).toBeNull();
    expect(areaExtent(groups, "normalized")).toBeNull();
  });

  test("ignores hidden series, negative values, and missing values", () => {
    expect(areaExtent(setup(rows, undefined, ["b"]).groups, "stacked")).toEqual(
      [0, 30],
    );
    expect(
      areaExtent(
        setup([
          { x: 0, s: "a", v: 10 },
          { x: 0, s: "b", v: -50 },
          { x: 0, s: "c", v: null },
        ]).groups,
        "stacked",
      ),
    ).toEqual([0, 10]);
  });
});

describe("buildAreas", () => {
  test("none: every layer rises from the zero line", () => {
    const { groups, scales } = setup(rows);
    const [a, b] = buildAreas(groups, scales);
    const zero = scales.y.map(0).toFixed(0);

    expect(a.area).toContain(`,${zero}`);
    expect(b.area).toContain(`,${zero}`);
    expect(a.tops.get(1)).toBeCloseTo(scales.y.map(20));
    expect(a.area.endsWith("Z")).toBe(true);
    expect(a.line.startsWith("M")).toBe(true);
  });

  test("none: a missing value is a gap in the layer and its line", () => {
    const { groups, scales } = setup([
      { x: 0, s: "a", v: 10 },
      { x: 1, s: "a", v: 20 },
      { x: 2, s: "a", v: null },
      { x: 3, s: "a", v: 20 },
      { x: 4, s: "a", v: 10 },
    ]);
    const [layer] = buildAreas(groups, scales);

    expect(subpaths(layer.line)).toBe(2);
    expect(subpaths(layer.area)).toBe(2);
  });

  test("stacked: each layer sits on the one below it", () => {
    const { groups, scales } = setup(rows);
    const [a, b] = buildAreas(groups, scales, { stack: "stacked" });

    expect(a.tops.get(0)).toBeCloseTo(scales.y.map(10));
    expect(b.tops.get(0)).toBeCloseTo(scales.y.map(40));
    expect(b.tops.get(2)).toBeCloseTo(scales.y.map(40));
  });

  test("stacked: a missing value counts as zero, so layers above stay whole", () => {
    const { groups, scales } = setup([
      { x: 0, s: "a", v: 10 },
      { x: 1, s: "a", v: null },
      { x: 2, s: "a", v: 10 },
      { x: 0, s: "b", v: 5 },
      { x: 1, s: "b", v: 5 },
      { x: 2, s: "b", v: 5 },
    ]);
    const [a, b] = buildAreas(groups, scales, { stack: "stacked" });

    expect(subpaths(a.area)).toBe(1);
    expect(subpaths(b.area)).toBe(1);
    expect(b.tops.get(1)).toBeCloseTo(scales.y.map(5));
  });

  test("stacked: a series missing an x entirely still gets a point there", () => {
    const { groups, scales } = setup([
      { x: 0, s: "a", v: 10 },
      { x: 2, s: "a", v: 10 },
      { x: 0, s: "b", v: 5 },
      { x: 1, s: "b", v: 5 },
      { x: 2, s: "b", v: 5 },
    ]);
    const [a] = buildAreas(groups, scales, { stack: "stacked" });

    expect(a.tops.get(1)).toBeCloseTo(scales.y.map(0));
  });

  test("normalized: the top layer reaches 1 at every x", () => {
    const { groups, scales } = setup(rows, [0, 1]);
    const [a, b] = buildAreas(groups, scales, { stack: "normalized" });

    for (const x of [0, 1, 2]) {
      expect(b.tops.get(x)).toBeCloseTo(scales.y.map(1));
    }
    expect(a.tops.get(0)).toBeCloseTo(scales.y.map(0.25));
  });

  test("stream: the stack is centered on zero", () => {
    const { groups, scales } = setup(rows, [-20, 20]);
    const [, b] = buildAreas(groups, scales, { stack: "stream" });

    expect(b.tops.get(0)).toBeCloseTo(scales.y.map(20));
  });

  test("skips hidden series and handles no data", () => {
    const { groups, scales } = setup(rows, undefined, ["b"]);

    expect(buildAreas(groups, scales).map((layer) => layer.key)).toEqual(["a"]);
    expect(buildAreas([], scales)).toEqual([]);
  });

  test("passes the curve through", () => {
    const { groups, scales } = setup(rows);

    expect(buildAreas(groups, scales, { curve: "monotone" })[0].line).toContain(
      "C",
    );
  });
});
