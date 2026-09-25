import { scaleLinear } from "../../../src/viz/utils/scale-linear.js";

function makeLcg(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2 ** 31;
    return state / 2 ** 31;
  };
}

describe("scaleLinear", () => {
  test("maps a value from domain to range", () => {
    const scale = scaleLinear({ domain: [0, 10], range: [0, 100] });
    expect(scale.map(5)).toBe(50);
  });

  test("inverts a value from range to domain", () => {
    const scale = scaleLinear({ domain: [0, 10], range: [0, 100] });
    expect(scale.invert(50)).toBe(5);
  });

  test("supports a reversed range", () => {
    const scale = scaleLinear({ domain: [0, 10], range: [200, 0] });
    expect(scale.map(0)).toBe(200);
    expect(scale.map(10)).toBe(0);
    expect(scale.map(5)).toBe(100);
  });

  test("supports a reversed domain", () => {
    const scale = scaleLinear({ domain: [10, 0], range: [0, 100] });
    expect(scale.map(10)).toBe(0);
    expect(scale.map(0)).toBe(100);
  });

  test("clamp keeps map inside the range", () => {
    const scale = scaleLinear({
      domain: [0, 10],
      range: [0, 100],
      clamp: true,
    });
    expect(scale.map(20)).toBe(100);
    expect(scale.map(-20)).toBe(0);
  });

  test("clamp keeps invert inside the domain", () => {
    const scale = scaleLinear({
      domain: [0, 10],
      range: [0, 100],
      clamp: true,
    });
    expect(scale.invert(200)).toBe(10);
    expect(scale.invert(-200)).toBe(0);
  });

  test("without clamp, map and invert extrapolate beyond the range", () => {
    const scale = scaleLinear({ domain: [0, 10], range: [0, 100] });
    expect(scale.map(20)).toBe(200);
    expect(scale.invert(200)).toBe(20);
  });

  test("a zero-width domain never yields NaN and maps to mid-range", () => {
    const scale = scaleLinear({ domain: [5, 5], range: [0, 100] });
    expect(scale.map(5)).toBe(50);
    expect(Number.isNaN(scale.map(5))).toBe(false);
  });

  test("a zero-width domain at zero never yields NaN", () => {
    // expandFlatDomain special-cases exactly-zero to [0, 1] rather than a
    // symmetric span, so the value lands at the start of the range here,
    // not mid-range as it does for a non-zero flat domain.
    const scale = scaleLinear({ domain: [0, 0], range: [0, 100] });
    expect(Number.isNaN(scale.map(0))).toBe(false);
    expect(scale.map(0)).toBe(0);
  });

  test("nice: true widens the domain to tick boundaries", () => {
    const scale = scaleLinear({
      domain: [0.3, 9.7],
      range: [0, 100],
      nice: true,
    });
    expect(scale.domain).toEqual([0, 10]);
  });

  test("nice: <number> uses it as the tick-count hint", () => {
    const scale = scaleLinear({ domain: [0, 97], range: [0, 100], nice: 2 });
    expect(scale.domain[0]).toBeLessThanOrEqual(0);
    expect(scale.domain[1]).toBeGreaterThanOrEqual(97);
  });

  test("domain on the returned scale is the resolved one", () => {
    const scale = scaleLinear({
      domain: [0.3, 9.7],
      range: [0, 100],
      nice: true,
    });
    expect(scale.domain).not.toEqual([0.3, 9.7]);
    expect(scale.domain).toEqual([0, 10]);
  });

  test("invert(map(x)) round-trips over pseudo-random values", () => {
    const scale = scaleLinear({ domain: [-37, 512], range: [12, 843] });
    const next = makeLcg(42);
    for (let i = 0; i < 50; i++) {
      const x = -37 + next() * (512 - -37);
      expect(scale.invert(scale.map(x))).toBeCloseTo(x, 9);
    }
  });
});
