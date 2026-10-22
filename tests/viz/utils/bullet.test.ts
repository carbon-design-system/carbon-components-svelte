import { getBulletGeometry } from "../../../src/viz/utils/bullet.js";

describe("getBulletGeometry", () => {
  test("places the measure, target, and bands on an explicit domain", () => {
    const result = getBulletGeometry({
      value: 270,
      target: 300,
      max: 400,
      bands: [150, 250],
    });

    expect(result.domain).toEqual([0, 400]);
    expect(result.valuePct).toBe(67.5);
    expect(result.targetPct).toBe(75);
    expect(result.bands.map((band) => [band.from, band.to, band.pct])).toEqual([
      [0, 150, 37.5],
      [150, 250, 25],
      [250, 400, 37.5],
    ]);
  });

  test("ends the domain at the largest input without a max", () => {
    expect(getBulletGeometry({ value: 50, target: 80 }).domain).toEqual([
      0, 80,
    ]);
    expect(getBulletGeometry({ value: 90, target: 80 }).domain).toEqual([
      0, 90,
    ]);
    expect(
      getBulletGeometry({ value: 50, target: 80, bands: [40, 120] }).domain,
    ).toEqual([0, 120]);
  });

  test("clamps the measure and the target to the domain", () => {
    const over = getBulletGeometry({ value: 500, target: -20, max: 100 });
    expect(over.valuePct).toBe(100);
    expect(over.targetPct).toBe(0);
  });

  test("honors a non-zero min", () => {
    const result = getBulletGeometry({ value: 75, min: 50, max: 100 });
    expect(result.valuePct).toBe(50);
  });

  test("has no target without one and no bands without bounds", () => {
    const result = getBulletGeometry({ value: 5, max: 10 });
    expect(result.targetPct).toBeNull();
    expect(result.bands).toEqual([]);
  });

  test("sorts bands and drops those outside the domain without mutating", () => {
    const bands = Object.freeze([250, 150, 900]);
    const result = getBulletGeometry({ value: 1, max: 400, bands });

    expect(result.bands.map((band) => band.to)).toEqual([150, 250, 400]);
    expect(result.bands.reduce((sum, band) => sum + band.pct, 0)).toBe(100);
  });

  test("returns zeros for a flat or non-finite domain", () => {
    expect(getBulletGeometry({ value: 0 }).valuePct).toBe(0);
    expect(getBulletGeometry({ value: Number.NaN, max: 10 }).valuePct).toBe(0);
  });
});
