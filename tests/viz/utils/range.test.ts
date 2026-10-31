import { getRangeGeometry } from "../../../src/viz/utils/range.js";

describe("getRangeGeometry", () => {
  test("places the value and the quartile box on the domain", () => {
    const result = getRangeGeometry({
      min: 0,
      max: 200,
      value: 50,
      quartiles: [40, 80, 140],
    });

    expect(result.valuePct).toBe(25);
    expect(result.outside).toBeNull();
    expect(result.box).toEqual({ startPct: 20, widthPct: 50, medianPct: 40 });
  });

  test("clamps the value and reports the side it left from", () => {
    expect(getRangeGeometry({ min: 10, max: 20, value: 5 })).toMatchObject({
      valuePct: 0,
      outside: "below",
    });
    expect(getRangeGeometry({ min: 10, max: 20, value: 50 })).toMatchObject({
      valuePct: 100,
      outside: "above",
    });
  });

  test("has no value position without a value and no box without quartiles", () => {
    expect(getRangeGeometry({ min: 0, max: 1 })).toEqual({
      valuePct: null,
      outside: null,
      box: null,
    });
  });

  test("sorts quartiles without mutating and rejects bad ones", () => {
    const quartiles = Object.freeze([140, 40, 80]);
    expect(
      getRangeGeometry({ min: 0, max: 200, quartiles }).box?.medianPct,
    ).toBe(40);
    expect(
      getRangeGeometry({ min: 0, max: 200, quartiles: [1, Number.NaN, 3] }).box,
    ).toBeNull();
    expect(
      getRangeGeometry({ min: 0, max: 200, quartiles: [1, 2] }).box,
    ).toBeNull();
  });

  test("returns zeros for a flat domain", () => {
    expect(
      getRangeGeometry({ min: 5, max: 5, value: 5, quartiles: [5, 5, 5] }),
    ).toEqual({ valuePct: 0, outside: null, box: null });
  });
});
