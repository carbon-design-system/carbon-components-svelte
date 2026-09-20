import { bin } from "../../../src/viz/utils/bin.js";

describe("bin", () => {
  test("counts sum to the number of finite values", () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const bins = bin(values);
    const total = bins.reduce((sum, b) => sum + b.count, 0);
    expect(total).toBe(values.length);
  });

  test("the last bin includes its upper edge", () => {
    const bins = bin([1, 2, 3, 4], { bins: 2, nice: false });
    expect(bins).toEqual([
      { x0: 1, x1: 2.5, count: 2 },
      { x0: 2.5, x1: 4, count: 2 },
    ]);
  });

  test("returns an empty array for empty input", () => {
    expect(bin([])).toEqual([]);
  });

  test("a single distinct value yields one bin", () => {
    expect(bin([5, 5, 5])).toEqual([{ x0: 5, x1: 5, count: 3 }]);
  });

  test("bins: 3, nice: false gives exact edges", () => {
    expect(bin([1, 2, 3, 10], { bins: 3, nice: false })).toEqual([
      { x0: 1, x1: 4, count: 3 },
      { x0: 4, x1: 7, count: 0 },
      { x0: 7, x1: 10, count: 1 },
    ]);
  });

  test("an explicit domain drops values outside it", () => {
    const bins = bin([1, 5, 100], { domain: [0, 10] });
    const total = bins.reduce((sum, b) => sum + b.count, 0);
    expect(total).toBe(2);
    expect(bins[0].x0).toBe(0);
    expect(bins[bins.length - 1].x1).toBe(10);
  });

  test('"freedman-diaconis" and "sturges" return a sane bin count', () => {
    const values = Array.from({ length: 100 }, (_, i) => i);
    const fd = bin(values, { bins: "freedman-diaconis" });
    const sturges = bin(values, { bins: "sturges" });
    expect(fd.length).toBeGreaterThan(0);
    expect(fd.length).toBeLessThanOrEqual(1000);
    expect(sturges.length).toBeGreaterThan(0);
    expect(sturges.length).toBeLessThanOrEqual(1000);
  });

  test("edges derived by index do not drift", () => {
    const bins = bin([0, 0.7], { bins: 7, domain: [0, 0.7], nice: false });
    const x0s = bins.map((b) => Math.round(b.x0 * 1e10) / 1e10);
    expect(x0s).toEqual([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6]);
  });

  test("non-finite input values are ignored", () => {
    const bins = bin([
      1,
      Number.NaN,
      2,
      Number.POSITIVE_INFINITY,
      null,
      undefined,
      3,
    ]);
    const total = bins.reduce((sum, b) => sum + b.count, 0);
    expect(total).toBe(3);
  });
});
