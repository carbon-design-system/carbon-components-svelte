import { flagAnomalies } from "../../../src/viz/utils/anomaly.js";

describe("flagAnomalies", () => {
  test("flags a value far from the mean and nothing else", () => {
    const values = [10, 11, 10, 12, 10, 11, 60, 10, 11, 10, 12, 10];
    const flags = flagAnomalies(values, { threshold: 2 });
    expect(flags.indexOf(true)).toBe(6);
    expect(flags.filter(Boolean)).toHaveLength(1);
  });

  test("flags nothing on a flat or tiny series", () => {
    expect(flagAnomalies([5, 5, 5, 5])).toEqual([false, false, false, false]);
    expect(flagAnomalies([5])).toEqual([false]);
    expect(flagAnomalies([])).toEqual([]);
  });

  test("never flags a missing value and does not count it", () => {
    const flags = flagAnomalies([10, null, 10, 11, Number.NaN, 10, 60, 10], {
      threshold: 2,
    });
    expect(flags).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
      true,
      false,
    ]);
  });

  test("a window compares each value with the ones before it", () => {
    // A level shift: the whole-series z-score sees two clusters and flags
    // nothing, the windowed one flags the step when it happens.
    const values = [10, 11, 10, 11, 10, 11, 30, 31, 30, 31, 30, 31];
    expect(flagAnomalies(values, { threshold: 3 }).some(Boolean)).toBe(false);
    const windowed = flagAnomalies(values, { threshold: 3, window: 6 });
    expect(windowed[6]).toBe(true);
    expect(windowed.slice(0, 6).some(Boolean)).toBe(false);
    expect(windowed.slice(8).some(Boolean)).toBe(false);
  });

  test("the window matches a direct computation on a long series", () => {
    const values = Array.from(
      { length: 5000 },
      (_, i) => Math.sin(i / 7) * 10 + (i % 997 === 0 ? 80 : 0),
    );
    const flags = flagAnomalies(values, { threshold: 4, window: 50 });
    const direct = values.map((value, i) => {
      const before = values.slice(Math.max(0, i - 50), i);
      if (before.length < 2) return false;
      const mean = before.reduce((a, b) => a + b, 0) / before.length;
      const deviation = Math.sqrt(
        before.reduce((a, b) => a + (b - mean) ** 2, 0) / before.length,
      );
      return deviation > 0 && Math.abs(value - mean) > 4 * deviation;
    });
    expect(flags).toEqual(direct);
    expect(flags.filter(Boolean).length).toBeGreaterThan(0);
  });
});
