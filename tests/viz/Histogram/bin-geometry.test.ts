import { buildBins } from "../../../src/viz/Chart/bin-geometry.js";
import {
  buildGroups,
  buildScales,
  resolveDomain,
} from "../../../src/viz/Chart/model.js";

type Row = { x0: number; x1: number; x: number; count: number };

const rows: Row[] = [
  { x0: 0, x1: 10, x: 5, count: 2 },
  { x0: 10, x1: 20, x: 15, count: 8 },
  { x0: 20, x1: 30, x: 25, count: 0 },
  { x0: 30, x1: 40, x: 35, count: 4 },
];

function setup(orientation: "vertical" | "horizontal" = "vertical") {
  const built = buildGroups(rows, {
    x: (row) => row.x,
    y: (row) => row.count,
    series: () => "Count",
  });
  const scales = buildScales(
    resolveDomain(built, { xDomain: [0, 40] }),
    { width: 440, height: 240 },
    { orientation },
  );
  return { groups: built.groups, scales };
}

describe("buildBins", () => {
  test("spans each bin's edges, touching its neighbor less the gap", () => {
    const { groups, scales } = setup();
    const bins = buildBins(groups, scales);

    // The empty bin draws nothing.
    expect(bins.map((bin) => bin.index)).toEqual([0, 1, 3]);
    const [first, second] = bins;
    expect(first.x).toBeCloseTo(scales.x.map(0));
    expect(first.x + first.width).toBeCloseTo(scales.x.map(10) - 1);
    expect(second.x).toBeCloseTo(scales.x.map(10));
    expect(first.at).toBe(5);
  });

  test("rises from zero in proportion to the count", () => {
    const { groups, scales } = setup();
    const [first, second] = buildBins(groups, scales);
    const zero = scales.y.map(0);

    expect(first.y + first.height).toBeCloseTo(zero);
    expect(second.height).toBeCloseTo(first.height * 4);
  });

  test("honors the gap and never collapses below one pixel", () => {
    const { groups, scales } = setup();

    expect(buildBins(groups, scales, { gap: 0 })[0].width).toBeCloseTo(
      scales.x.map(10) - scales.x.map(0),
    );
    expect(buildBins(groups, scales, { gap: 1000 })[0].width).toBe(1);
  });

  test("lies on its side in a horizontal chart", () => {
    const { groups, scales } = setup("horizontal");
    const [first, second] = buildBins(groups, scales);

    expect(first.x).toBeCloseTo(scales.y.map(0));
    expect(second.width).toBeCloseTo(first.width * 4);
    expect(first.y).toBeCloseTo(scales.x.map(0));
    expect(second.y).toBeGreaterThan(first.y);
  });

  test("skips hidden series and returns nothing for no groups", () => {
    const { groups, scales } = setup();

    expect(buildBins([{ ...groups[0], hidden: true }], scales)).toEqual([]);
    expect(buildBins([], scales)).toEqual([]);
  });
});
