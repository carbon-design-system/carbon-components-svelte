import { getHistogramGeometry } from "../../../src/viz/utils/histogram.js";

const bins = [
  { x0: 0, x1: 10, count: 2 },
  { x0: 10, x1: 20, count: 8 },
  { x0: 20, x1: 30, count: 4 },
  { x0: 30, x1: 40, count: 0 },
];

describe("getHistogramGeometry", () => {
  test("sizes bars against the fullest bin", () => {
    const result = getHistogramGeometry(bins);

    expect(result.bars.map((bar) => bar.pct)).toEqual([25, 100, 50, 0]);
    expect(result.total).toBe(14);
    expect(result.max).toBe(8);
    expect(result.domain).toEqual([0, 40]);
    expect(result.markerPct).toBeNull();
    expect(result.bars.some((bar) => bar.marked)).toBe(false);
  });

  test("places the marker and flags the bin that holds it", () => {
    const result = getHistogramGeometry(bins, 25);

    expect(result.markerPct).toBe(62.5);
    expect(result.bars.map((bar) => bar.marked)).toEqual([
      false,
      false,
      true,
      false,
    ]);
  });

  test("puts a marker on an edge into the upper bin", () => {
    expect(getHistogramGeometry(bins, 20).bars[2].marked).toBe(true);
  });

  test("clamps a marker outside the domain to the end bin", () => {
    const below = getHistogramGeometry(bins, -5);
    expect(below.markerPct).toBe(0);
    expect(below.bars[0].marked).toBe(true);

    const above = getHistogramGeometry(bins, 99);
    expect(above.markerPct).toBe(100);
    expect(above.bars[3].marked).toBe(true);
  });

  test("handles no bins and a zero-width domain", () => {
    expect(getHistogramGeometry([], 5)).toEqual({
      bars: [],
      total: 0,
      max: 0,
      domain: [0, 0],
      markerPct: null,
    });
    expect(
      getHistogramGeometry([{ x0: 5, x1: 5, count: 3 }], 5).markerPct,
    ).toBe(50);
  });
});
