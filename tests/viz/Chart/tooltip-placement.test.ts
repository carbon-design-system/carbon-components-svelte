import {
  buildGroups,
  buildScales,
  resolveDomain,
} from "../../../src/viz/Chart/model.js";
import {
  estimateTooltipSize,
  freeCorner,
  seriesSegments,
} from "../../../src/viz/Chart/tooltip-placement.js";

describe("estimateTooltipSize", () => {
  test("grows with the longest line and the row count, never under the minimum", () => {
    const small = estimateTooltipSize("Jun", [{ label: "a", value: "1" }]);
    expect(small.width).toBe(128);
    expect(small.height).toBe(52);
    const wide = estimateTooltipSize("A very long title for a tooltip", [
      { label: "series", value: "12.3K" },
      { label: "other", value: "1" },
    ]);
    expect(wide.width).toBeGreaterThan(128);
    expect(wide.height).toBe(70);
  });
});

describe("freeCorner", () => {
  const plot = { x0: 0, y0: 0, x1: 300, y1: 200 };
  const box = { width: 100, height: 40 };

  test("takes the top left when nothing crosses it, and the next corner in order otherwise", () => {
    expect(freeCorner(plot, box, [])).toEqual({ x: 8, y: 8, corner: "tl" });
    // A line through the top left.
    const tl = freeCorner(plot, box, [[0, 20, 150, 20]]);
    expect(tl?.corner).toBe("tr");
    // A line across the whole top.
    const top = freeCorner(plot, box, [[0, 20, 300, 20]]);
    expect(top?.corner).toBe("bl");
  });

  test("counts a line grazing the box as crossing, and gives up when every corner is taken", () => {
    const grazing = freeCorner(plot, box, [[0, 52, 300, 52]]);
    expect(grazing?.corner).toBe("bl");
    const everywhere = freeCorner(plot, box, [
      [0, 20, 300, 20],
      [0, 180, 300, 180],
    ]);
    expect(everywhere).toBeNull();
    expect(freeCorner({ x0: 0, y0: 0, x1: 100, y1: 40 }, box, [])).toBeNull();
  });
});

describe("seriesSegments", () => {
  test("joins consecutive points of each visible series and breaks at a gap", () => {
    const rows = [
      { x: 0, y: 10, s: "a" },
      { x: 1, y: null, s: "a" },
      { x: 2, y: 30, s: "a" },
      { x: 3, y: 40, s: "a" },
      { x: 0, y: 5, s: "b" },
    ];
    const built = buildGroups(rows, {
      x: (row) => row.x,
      y: (row) => row.y,
      series: (row) => row.s,
      hidden: ["b"],
    });
    const scales = buildScales(
      resolveDomain(built, {}),
      { width: 300, height: 200 },
      {},
    );
    const segments = seriesSegments(built.groups, scales);
    // One lone point before the gap, one lone point after it, then one segment.
    expect(segments).toHaveLength(3);
    expect(segments[0][0]).toBe(segments[0][2]);
    expect(segments[2][0]).toBeLessThan(segments[2][2]);
    // Bars fill to the baseline: every point also drops a segment to it.
    const filled = seriesSegments(built.groups, scales, { toBaseline: true });
    expect(filled).toHaveLength(6);
    const drop = filled[1];
    expect(drop[0]).toBe(drop[2]);
    expect(drop[1]).toBeGreaterThan(drop[3]);
  });
});
