import { niceDomain, tickStep, ticks } from "../../../src/viz/utils/ticks.js";

describe("ticks", () => {
  test("ticks(0, 1, 10) lands on exact tenths, not float noise", () => {
    const values = ticks(0, 1, 10);
    expect(values).toEqual([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]);
    expect(values[3]).toBe(0.3);
  });

  test("reversed bounds still produce ascending output", () => {
    expect(ticks(1, 0, 10)).toEqual(ticks(0, 1, 10));
  });

  test("min === max returns that single value", () => {
    expect(ticks(5, 5)).toEqual([5]);
  });

  test("non-finite bounds return an empty array", () => {
    expect(ticks(Number.NaN, 1)).toEqual([]);
    expect(ticks(0, Number.POSITIVE_INFINITY)).toEqual([]);
  });

  test("handles a tiny span", () => {
    const values = ticks(0, 1e-9, 5);
    expect(values.length).toBeGreaterThan(0);
    expect(values[0]).toBeGreaterThanOrEqual(0);
    expect(values[values.length - 1]).toBeLessThanOrEqual(1e-9);
  });

  test("handles a huge span", () => {
    const values = ticks(0, 1e12, 5);
    expect(values.length).toBeGreaterThan(0);
    for (const value of values) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1e12);
    }
  });
});

describe("tickStep", () => {
  test("returns 0 for an empty span", () => {
    expect(tickStep(5, 5)).toBe(0);
  });

  test("returns 0 for a non-finite span", () => {
    expect(tickStep(0, Number.POSITIVE_INFINITY)).toBe(0);
  });

  test("returns the distance between ticks", () => {
    expect(tickStep(0, 1, 10)).toBeCloseTo(0.1);
  });
});

describe("niceDomain", () => {
  test("widens a domain outward to tick boundaries", () => {
    expect(niceDomain(0.3, 9.7, 5)).toEqual([0, 10]);
  });

  test("keeps a reversed domain reversed", () => {
    const [lo, hi] = niceDomain(0.3, 9.7, 5);
    expect(niceDomain(9.7, 0.3, 5)).toEqual([hi, lo]);
  });

  test("is idempotent", () => {
    const once = niceDomain(0.3, 9.7, 5);
    const twice = niceDomain(once[0], once[1], 5);
    expect(twice).toEqual(once);
  });

  test("min === max returns the input unchanged", () => {
    expect(niceDomain(5, 5)).toEqual([5, 5]);
  });

  test("non-finite input returns the input unchanged", () => {
    expect(niceDomain(Number.NaN, 1)).toEqual([Number.NaN, 1]);
  });
});
