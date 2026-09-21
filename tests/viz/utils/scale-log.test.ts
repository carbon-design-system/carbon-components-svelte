import {
  logTicks,
  niceLogDomain,
  scaleLog,
} from "../../../src/viz/utils/scale-log.js";

describe("scaleLog", () => {
  test("maps powers of ten evenly", () => {
    const scale = scaleLog({ domain: [1, 1000], range: [0, 300] });
    expect(scale.map(1)).toBeCloseTo(0);
    expect(scale.map(10)).toBeCloseTo(100);
    expect(scale.map(100)).toBeCloseTo(200);
    expect(scale.map(1000)).toBeCloseTo(300);
  });

  test("invert round-trips", () => {
    const scale = scaleLog({ domain: [1, 1000], range: [0, 300] });
    for (const value of [1, 5, 42, 999]) {
      expect(scale.invert(scale.map(value))).toBeCloseTo(value, 6);
    }
  });

  test("supports an all-negative domain", () => {
    const scale = scaleLog({ domain: [-1000, -1], range: [0, 300] });
    expect(scale.map(-1000)).toBeCloseTo(0);
    expect(scale.map(-1)).toBeCloseTo(300);
    expect(scale.invert(scale.map(-42))).toBeCloseTo(-42, 6);
  });

  test("falls back to a linear scale when the domain touches zero", () => {
    const scale = scaleLog({ domain: [0, 100], range: [0, 100] });
    expect(scale.kind).toBe("linear");
    expect(scale.map(50)).toBe(50);
  });

  test("falls back to a linear scale when the domain crosses zero", () => {
    const scale = scaleLog({ domain: [-10, 10], range: [0, 100] });
    expect(scale.kind).toBe("linear");
  });

  test("falls back to a linear scale for a zero-width domain", () => {
    const scale = scaleLog({ domain: [5, 5], range: [0, 100] });
    expect(scale.kind).toBe("linear");
    expect(Number.isNaN(scale.map(5))).toBe(false);
  });

  test("reports kind: log for a valid domain", () => {
    const scale = scaleLog({ domain: [1, 1000], range: [0, 300] });
    expect(scale.kind).toBe("log");
  });

  test("supports a custom base", () => {
    const scale = scaleLog({ domain: [1, 8], range: [0, 300], base: 2 });
    expect(scale.map(1)).toBeCloseTo(0);
    expect(scale.map(2)).toBeCloseTo(100);
    expect(scale.map(4)).toBeCloseTo(200);
    expect(scale.map(8)).toBeCloseTo(300);
  });

  test("clamp keeps map inside the range", () => {
    const scale = scaleLog({ domain: [1, 1000], range: [0, 300], clamp: true });
    expect(scale.map(1_000_000)).toBe(300);
    expect(scale.map(0.001)).toBe(0);
  });
});

describe("niceLogDomain", () => {
  test("rounds out to whole powers", () => {
    expect(niceLogDomain(3, 4200)).toEqual([1, 10000]);
    expect(niceLogDomain(1000, 1000000)).toEqual([1000, 1000000]);
    expect(niceLogDomain(0.02, 0.9)).toEqual([0.01, 1]);
    expect(niceLogDomain(3, 40, 2)).toEqual([2, 64]);
  });

  test("always spans at least one power", () => {
    expect(niceLogDomain(10, 10)).toEqual([10, 100]);
  });

  test("leaves a domain that is not strictly positive alone", () => {
    expect(niceLogDomain(0, 100)).toEqual([0, 100]);
    expect(niceLogDomain(-5, 100)).toEqual([-5, 100]);
  });
});

describe("logTicks", () => {
  test("is every power over a wide domain", () => {
    expect(logTicks(1, 100000)).toEqual([1, 10, 100, 1000, 10000, 100000]);
  });

  test("adds the 2 and 5 multiples over a narrow one", () => {
    expect(logTicks(1, 100)).toEqual([1, 2, 5, 10, 20, 50, 100]);
    expect(logTicks(3, 40)).toEqual([5, 10, 20]);
  });

  test("is empty without a positive span", () => {
    expect(logTicks(0, 100)).toEqual([]);
    expect(logTicks(10, 10)).toEqual([]);
  });
});
