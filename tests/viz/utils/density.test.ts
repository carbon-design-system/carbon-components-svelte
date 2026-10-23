import { kernelDensity, silverman } from "../../../src/viz/utils/density.js";

const sample = [10, 12, 12, 13, 14, 15, 15, 16, 18, 30];

describe("kernelDensity", () => {
  test("samples a curve across the widened range that integrates to about one", () => {
    const density = kernelDensity(sample, { points: 200 });
    expect(density.count).toBe(10);
    expect(density.points).toHaveLength(200);
    expect(density.points[0].x).toBeLessThan(10);
    expect(density.points[199].x).toBeGreaterThan(30);
    const step = density.points[1].x - density.points[0].x;
    const area = density.points.reduce((sum, point) => sum + point.y * step, 0);
    expect(area).toBeCloseTo(1, 1);
    expect(density.peak).toBeGreaterThan(0);
    // The mode sits among the cluster in the low teens, not at the outlier.
    const mode = density.points.reduce((best, point) =>
      point.y > best.y ? point : best,
    );
    expect(mode.x).toBeGreaterThan(11);
    expect(mode.x).toBeLessThan(17);
  });

  test("takes a bandwidth and a domain, and ignores what is not a number", () => {
    const density = kernelDensity([...sample, null, Number.NaN], {
      bandwidth: 2,
      domain: [0, 40],
      points: 5,
    });
    expect(density.bandwidth).toBe(2);
    expect(density.points.map((p) => p.x)).toEqual([0, 10, 20, 30, 40]);
    expect(density.count).toBe(10);
  });

  test("is empty with nothing to measure", () => {
    expect(kernelDensity([null, undefined])).toEqual({
      points: [],
      bandwidth: 0,
      peak: 0,
      count: 0,
    });
  });

  test("picks a bandwidth from the spread and the count", () => {
    expect(silverman([1, 2, 3, 4, 5])).toBeGreaterThan(0);
    expect(silverman([1, 2, 3, 4, 5])).toBeGreaterThan(
      silverman([1, 1.1, 1.2, 1.3, 1.4]),
    );
    expect(silverman([5])).toBe(1);
  });
});
