import {
  boxStats,
  quantile,
  sortedFinite,
} from "../../../src/viz/utils/quantiles.js";

describe("quantile", () => {
  test("R-7 fixtures", () => {
    expect(quantile([1, 2, 3, 4], 0.5)).toBe(2.5);
    expect(quantile([1, 2, 3, 4, 5], 0.25)).toBe(2);
  });

  test("p <= 0 returns the first value", () => {
    expect(quantile([3, 5, 9], 0)).toBe(3);
    expect(quantile([3, 5, 9], -1)).toBe(3);
  });

  test("p >= 1 returns the last value", () => {
    expect(quantile([3, 5, 9], 1)).toBe(9);
    expect(quantile([3, 5, 9], 2)).toBe(9);
  });

  test("empty input returns NaN", () => {
    expect(Number.isNaN(quantile([], 0.5))).toBe(true);
  });

  test("a single value returns that value regardless of p", () => {
    expect(quantile([7], 0.5)).toBe(7);
    expect(quantile([7], 0)).toBe(7);
    expect(quantile([7], 1)).toBe(7);
  });
});

describe("sortedFinite", () => {
  test("filters and sorts without mutating the input", () => {
    const values = [
      3,
      null,
      Number.NaN,
      1,
      undefined,
      Number.POSITIVE_INFINITY,
      2,
    ];
    const snapshot = [...values];
    expect(sortedFinite(values)).toEqual([1, 2, 3]);
    expect(values).toEqual(snapshot);
  });
});

describe("boxStats", () => {
  test("known fixture", () => {
    const stats = boxStats([1, 2, 3, 4, 5, 6, 7, 8, 9, 100]);
    expect(stats).toEqual({
      min: 1,
      q1: 3.25,
      median: 5.5,
      q3: 7.75,
      max: 100,
      whiskerLow: 1,
      whiskerHigh: 9,
      outliers: [100],
      mean: 14.5,
      count: 10,
    });
  });

  test("n = 0 returns null", () => {
    expect(boxStats([])).toBeNull();
  });

  test("n = 1", () => {
    expect(boxStats([5])).toEqual({
      min: 5,
      q1: 5,
      median: 5,
      q3: 5,
      max: 5,
      whiskerLow: 5,
      whiskerHigh: 5,
      outliers: [],
      mean: 5,
      count: 1,
    });
  });

  test("n = 2", () => {
    expect(boxStats([1, 10])).toEqual({
      min: 1,
      q1: 3.25,
      median: 5.5,
      q3: 7.75,
      max: 10,
      whiskerLow: 1,
      whiskerHigh: 10,
      outliers: [],
      mean: 5.5,
      count: 2,
    });
  });

  test("ignores null and NaN", () => {
    const stats = boxStats([1, null, Number.NaN, 2, undefined, 3]);
    expect(stats?.count).toBe(3);
    expect(stats?.min).toBe(1);
    expect(stats?.max).toBe(3);
  });
});
