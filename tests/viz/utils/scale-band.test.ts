import { scaleBand, scalePoint } from "../../../src/viz/utils/scale-band.js";

describe("scaleBand", () => {
  test("computes step and bandwidth with no padding", () => {
    const scale = scaleBand({ domain: ["a", "b", "c", "d"], range: [0, 100] });
    expect(scale.step).toBe(25);
    expect(scale.bandwidth).toBe(25);
    expect(scale.map("a")).toBe(0);
    expect(scale.map("b")).toBe(25);
    expect(scale.map("c")).toBe(50);
    expect(scale.map("d")).toBe(75);
  });

  test("computes step, bandwidth, and start with paddingInner and paddingOuter", () => {
    const scale = scaleBand({
      domain: ["a", "b", "c"],
      range: [0, 120],
      paddingInner: 0.5,
      paddingOuter: 0.5,
    });
    expect(scale.step).toBeCloseTo(34.2857142857);
    expect(scale.bandwidth).toBeCloseTo(17.1428571429);
    expect(scale.map("a")).toBeCloseTo(17.1428571429);
    expect(scale.map("b")).toBeCloseTo(51.4285714286);
    expect(scale.map("c")).toBeCloseTo(85.7142857143);
  });

  test("duplicate keys: first occurrence wins and domain is deduped", () => {
    const scale = scaleBand({ domain: ["a", "a", "b"], range: [0, 100] });
    expect(scale.domain).toEqual(["a", "b"]);
    expect(scale.step).toBe(50);
    expect(scale.map("a")).toBe(0);
    expect(scale.map("b")).toBe(50);
  });

  test("unknown key maps to undefined", () => {
    const scale = scaleBand({ domain: ["a", "b"], range: [0, 100] });
    expect(scale.map("z")).toBeUndefined();
  });

  test("invert returns the containing key and clamps at both ends", () => {
    const scale = scaleBand({ domain: ["a", "b", "c"], range: [0, 90] });
    expect(scale.invert(-50)).toBe("a");
    expect(scale.invert(5)).toBe("a");
    expect(scale.invert(45)).toBe("b");
    expect(scale.invert(200)).toBe("c");
  });

  test("reversed range reverses positions", () => {
    const scale = scaleBand({ domain: ["a", "b", "c"], range: [100, 0] });
    const [a, b, c] = [scale.map("a"), scale.map("b"), scale.map("c")];
    expect(a).toBeGreaterThan(b ?? Number.NaN);
    expect(b).toBeGreaterThan(c ?? Number.NaN);
    expect(c).toBeCloseTo(0);
  });

  test("round: true gives integer step, bandwidth, and start, never exceeding the range", () => {
    const scale = scaleBand({
      domain: ["a", "b", "c"],
      range: [0, 100],
      round: true,
    });
    expect(Number.isInteger(scale.step)).toBe(true);
    expect(Number.isInteger(scale.bandwidth)).toBe(true);
    expect(Number.isInteger(scale.map("a"))).toBe(true);
    const lastEnd = (scale.map("c") ?? 0) + scale.bandwidth;
    expect(lastEnd).toBeLessThanOrEqual(100);
  });

  test("empty domain produces no lookups", () => {
    const scale = scaleBand<string>({ domain: [], range: [0, 100] });
    expect(scale.domain).toEqual([]);
    expect(scale.map("a")).toBeUndefined();
    expect(scale.invert(50)).toBeUndefined();
  });

  test("a single key fills the whole range", () => {
    const scale = scaleBand({ domain: ["a"], range: [0, 100] });
    expect(scale.map("a")).toBe(0);
    expect(scale.bandwidth).toBe(100);
  });
});

describe("scalePoint", () => {
  test("has zero bandwidth", () => {
    const scale = scalePoint({ domain: ["a", "b", "c"], range: [0, 100] });
    expect(scale.bandwidth).toBe(0);
  });

  test("a single key sits mid-range", () => {
    const scale = scalePoint({ domain: ["a"], range: [0, 100] });
    expect(scale.map("a")).toBe(50);
  });

  test("first and last keys sit on the range ends when padding is 0", () => {
    const scale = scalePoint({
      domain: ["a", "b", "c"],
      range: [0, 100],
      padding: 0,
    });
    expect(scale.map("a")).toBe(0);
    expect(scale.map("c")).toBe(100);
  });
});
