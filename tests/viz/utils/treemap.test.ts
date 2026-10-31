import { squarify } from "../../../src/viz/utils/treemap.js";

const area = (r: { width: number; height: number }) => r.width * r.height;

describe("squarify", () => {
  test("gives each value an area in proportion, filling the box", () => {
    const values = [6, 6, 4, 3, 2, 2, 1];
    const rects = squarify(values, { x: 0, y: 0, width: 6, height: 4 });

    for (const [i, rect] of rects.entries()) {
      expect(area(rect)).toBeCloseTo(values[i]);
    }
    expect(rects.reduce((sum, rect) => sum + area(rect), 0)).toBeCloseTo(24);
    for (const rect of rects) {
      expect(rect.x).toBeGreaterThanOrEqual(-1e-9);
      expect(rect.y).toBeGreaterThanOrEqual(-1e-9);
      expect(rect.x + rect.width).toBeLessThanOrEqual(6 + 1e-9);
      expect(rect.y + rect.height).toBeLessThanOrEqual(4 + 1e-9);
    }
  });

  test("matches the worked example from the paper", () => {
    // 6x4 box: the first row holds the two 6s, stacked down the left.
    const [a, b] = squarify([6, 6, 4, 3, 2, 2, 1], {
      x: 0,
      y: 0,
      width: 6,
      height: 4,
    });

    expect(a).toEqual({ x: 0, y: 0, width: 3, height: 2 });
    expect(b).toEqual({ x: 0, y: 2, width: 3, height: 2 });
  });

  test("keeps cells close to square", () => {
    const rects = squarify([6, 6, 4, 3, 2, 2, 1], {
      x: 0,
      y: 0,
      width: 6,
      height: 4,
    });
    const ratios = rects.map((r) =>
      Math.max(r.width / r.height, r.height / r.width),
    );

    expect(Math.max(...ratios)).toBeLessThan(3);
  });

  test("never overlaps", () => {
    const rects = squarify([5, 3, 8, 1, 9, 2, 4]);
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i];
        const b = rects[j];
        const apart =
          a.x + a.width <= b.x + 1e-9 ||
          b.x + b.width <= a.x + 1e-9 ||
          a.y + a.height <= b.y + 1e-9 ||
          b.y + b.height <= a.y + 1e-9;
        expect(apart).toBe(true);
      }
    }
  });

  test("returns output in input order and empties bad values", () => {
    const frozen = Object.freeze([1, -2, Number.NaN, 3]);
    const rects = squarify(frozen);

    expect(area(rects[1])).toBe(0);
    expect(area(rects[2])).toBe(0);
    expect(area(rects[3])).toBeCloseTo(0.75);
    expect(area(rects[0])).toBeCloseTo(0.25);
  });

  test("handles nothing to draw", () => {
    expect(squarify([])).toEqual([]);
    expect(squarify([0, 0]).every((rect) => area(rect) === 0)).toBe(true);
    expect(
      squarify([1], { x: 0, y: 0, width: 0, height: 1 }).every(
        (rect) => area(rect) === 0,
      ),
    ).toBe(true);
  });
});
