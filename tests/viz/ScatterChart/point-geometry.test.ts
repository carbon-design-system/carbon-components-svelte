import {
  buildGroups,
  buildScales,
  resolveDomain,
} from "../../../src/viz/Chart/model.js";
import { buildPoints } from "../../../src/viz/Chart/point-geometry.js";

type Row = { x: number; y: number | null; s: string; n: number };

const rows: Row[] = [
  { x: 1, y: 10, s: "a", n: 0 },
  { x: 2, y: 20, s: "a", n: 50 },
  { x: 3, y: null, s: "a", n: 10 },
  { x: 2, y: 5, s: "b", n: 100 },
];

function setup(
  hidden: string[] = [],
  orientation: "vertical" | "horizontal" = "vertical",
) {
  const built = buildGroups(rows, {
    x: (row) => row.x,
    y: (row) => row.y,
    series: (row) => row.s,
    hidden,
  });
  const scales = buildScales(
    resolveDomain(built, { xDomain: "nice" }),
    { width: 440, height: 240 },
    { orientation },
  );
  return { groups: built.groups, scales };
}

describe("buildPoints", () => {
  test("places one circle per datum with a finite y", () => {
    const { groups, scales } = setup();
    const circles = buildPoints(groups, scales);

    expect(circles.map((c) => c.key)).toEqual(["a:0", "a:1", "b:0"]);
    expect(circles[0]).toMatchObject({
      cx: scales.x.map(1),
      cy: scales.y.map(10),
      r: 4,
      size: null,
    });
    expect(circles.every((c) => c.r === 4)).toBe(true);
  });

  test("scales area, not radius, with the size, largest first", () => {
    const { groups, scales } = setup();
    const circles = buildPoints(groups, scales, {
      size: (row: Row) => row.n,
      sizeRange: [2, 10],
    });

    expect(circles.map((c) => c.key)).toEqual(["b:0", "a:1", "a:0"]);
    const [big, mid, small] = circles;
    expect(big.r).toBeCloseTo(10);
    expect(small.r).toBeCloseTo(2);
    // Half the value is half the area between the ends, not half the radius.
    expect(mid.r ** 2).toBeCloseTo((2 ** 2 + 10 ** 2) / 2);
    expect(mid.size).toBe(50);
  });

  test("keeps sizes stable when a series is hidden", () => {
    const all = setup();
    const some = setup(["b"]);
    const options = { size: (row: Row) => row.n };

    const before = buildPoints(all.groups, all.scales, options).find(
      (c) => c.key === "a:1",
    );
    const after = buildPoints(some.groups, some.scales, options).find(
      (c) => c.key === "a:1",
    );
    expect(after?.r).toBeCloseTo(before?.r ?? Number.NaN);
    expect(
      buildPoints(some.groups, some.scales, options).some(
        (c) => c.series === "b",
      ),
    ).toBe(false);
  });

  test("swaps the axes in a horizontal chart", () => {
    const { groups, scales } = setup([], "horizontal");
    const [first] = buildPoints(groups, scales);

    expect(first.cx).toBeCloseTo(scales.y.map(10));
    expect(first.cy).toBeCloseTo(scales.x.map(1));
  });

  test("rounds a numeric x out to tick values when asked", () => {
    const built = buildGroups(
      [
        { x: 3, y: 1 },
        { x: 97, y: 2 },
      ],
      {
        x: (row) => row.x,
        y: (row) => row.y,
        series: () => "s",
      },
    );

    expect(resolveDomain(built, {}).x).toEqual([3, 97]);
    expect(resolveDomain(built, { xDomain: "nice" }).x).toEqual([0, 100]);
  });
});
