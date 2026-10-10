import {
  getSparklineBars,
  getSparklineDomain,
  getSparklinePoints,
  normalizeSparklineValues,
  toAreaPath,
  toLinePath,
} from "../../../src/viz/utils/sparkline.js";

describe("normalizeSparklineValues", () => {
  test("returns an empty array for empty input", () => {
    expect(normalizeSparklineValues([])).toEqual([]);
  });

  test("replaces missing and non-finite entries with null, keeping positions", () => {
    expect(
      normalizeSparklineValues([
        1,
        Number.NaN,
        2,
        Number.POSITIVE_INFINITY,
        Number.NEGATIVE_INFINITY,
        3,
        null,
        undefined,
      ]),
    ).toEqual([1, null, 2, null, null, 3, null, null]);
  });
});

describe("getSparklineDomain", () => {
  test("expands a zero-width extent symmetrically", () => {
    expect(getSparklineDomain([5, 5, 5])).toEqual({ min: 4, max: 6 });
  });

  test("clamps to overrides instead of the data extent", () => {
    expect(getSparklineDomain([1, 2, 3], { min: 0, max: 10 })).toEqual({
      min: 0,
      max: 10,
    });
  });

  test("widens the extent to include zero when includeZero is set", () => {
    expect(getSparklineDomain([1, 2, 3], { includeZero: true })).toEqual({
      min: 0,
      max: 3,
    });
    expect(getSparklineDomain([-3, -1], { includeZero: true })).toEqual({
      min: -3,
      max: 0,
    });
  });
});

describe("getSparklinePoints", () => {
  test("returns an empty array for empty input", () => {
    expect(getSparklinePoints([], { width: 96, height: 24 })).toEqual([]);
  });

  test("a flat series yields all y === height / 2", () => {
    const points = getSparklinePoints([5, 5, 5, 5], {
      width: 96,
      height: 24,
    });
    expect(points.every((point) => point?.y === 12)).toBe(true);
  });

  test("overrides clamp out-of-range values", () => {
    const points = getSparklinePoints([0, 5, 10], {
      width: 100,
      height: 20,
      min: 2,
      max: 8,
    });
    expect(points[0]?.y).toBe(20);
    expect(points[2]?.y).toBe(0);
  });

  test("a single value returns one centered point", () => {
    const points = getSparklinePoints([5], { width: 100, height: 20 });
    expect(points).toEqual([{ x: 50, y: 10 }]);
  });
});

describe("toLinePath", () => {
  test("returns an empty string for no points", () => {
    expect(toLinePath([])).toBe("");
  });

  test("a single point is a zero-length segment that round caps paint as a dot", () => {
    const points = getSparklinePoints([5], { width: 100, height: 20 });
    expect(toLinePath(points)).toBe("M50,10l0,0");
  });

  test("a null point is a gap that starts a new subpath", () => {
    const points = getSparklinePoints([0, 10, null, 10, 0], {
      width: 100,
      height: 10,
    });
    expect(points[2]).toBeNull();
    // Later points keep their own slots instead of shifting left.
    expect(points[3]).toEqual({ x: 75, y: 0 });
    expect(toLinePath(points)).toBe("M0,10L25,0M75,0L100,10");
  });

  test("builds an M/L path through every point", () => {
    const path = toLinePath([
      { x: 0, y: 10 },
      { x: 50, y: 0 },
      { x: 100, y: 10 },
    ]);
    expect(path).toBe("M0,10L50,0L100,10");
  });
});

describe("toAreaPath", () => {
  test("returns an empty string for fewer than two points", () => {
    expect(toAreaPath([], 20)).toBe("");
    expect(toAreaPath([{ x: 0, y: 0 }], 20)).toBe("");
  });

  test("closes the line path down to the baseline", () => {
    const path = toAreaPath(
      [
        { x: 0, y: 10 },
        { x: 100, y: 0 },
      ],
      20,
    );
    expect(path).toBe("M0,10L100,0L100,20L0,20Z");
  });
});

describe("getSparklineBars", () => {
  test("returns an empty array for empty input", () => {
    expect(getSparklineBars([], { width: 96, height: 24 })).toEqual([]);
  });

  test("bar count equals values length", () => {
    const bars = getSparklineBars([1, 2, 3, 4], { width: 96, height: 24 });
    expect(bars).toHaveLength(4);
  });

  test("baseline sits strictly between 0 and height for a series with negatives", () => {
    const bars = getSparklineBars([-2, 3, -1], { width: 90, height: 30 });

    // A negative value draws down from the baseline, so its top edge (y) is
    // the baseline; a positive value draws up to it, so its bottom edge
    // (y + height) is the baseline.
    const negativeBaseline = bars[0]?.y;
    const positiveBaseline = (bars[1]?.y ?? 0) + (bars[1]?.height ?? 0);
    expect(negativeBaseline).toBe(positiveBaseline);
    expect(negativeBaseline).toBeGreaterThan(0);
    expect(negativeBaseline).toBeLessThan(30);
  });

  test("a long series gives up gap, then width, and never overflows", () => {
    const fits = getSparklineBars(new Array(40).fill(1), {
      width: 96,
      height: 24,
      gap: 2,
    });
    const lastFit = fits[fits.length - 1];
    expect(lastFit?.width).toBe(1);
    expect((lastFit?.x ?? 0) + (lastFit?.width ?? 0)).toBeCloseTo(96);

    const dense = getSparklineBars(new Array(1000).fill(1), {
      width: 96,
      height: 24,
      gap: 2,
    });
    const last = dense[dense.length - 1];
    expect((last?.x ?? 0) + (last?.width ?? 0)).toBeCloseTo(96);
  });

  test("a null value leaves its slot empty", () => {
    const bars = getSparklineBars([1, null, 3], { width: 30, height: 10 });
    expect(bars[1]).toBeNull();
    expect(bars[2]?.x).toBe(20);
  });
});
