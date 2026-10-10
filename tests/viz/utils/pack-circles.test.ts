import { packCircles } from "../../../src/viz/utils/pack-circles.js";

function overlaps(
  circles: Array<{ x: number; y: number; r: number }>,
  gap = 0,
) {
  const hits: string[] = [];
  for (let i = 0; i < circles.length; i++) {
    for (let j = i + 1; j < circles.length; j++) {
      const a = circles[i];
      const b = circles[j];
      if (a.r === 0 || b.r === 0) continue;
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (distance < a.r + b.r + gap - 1e-4) hits.push(`${i}/${j}`);
    }
  }
  return hits;
}

describe("packCircles", () => {
  test("never overlaps, and keeps input order and radii", () => {
    const radii = [10, 40, 25, 5, 30, 12, 18, 8, 22, 6, 15, 9];
    const { circles } = packCircles(radii);

    expect(circles.map((c) => c.r)).toEqual(radii);
    expect(overlaps(circles)).toEqual([]);
  });

  test("packs tightly: every circle after the first touches another", () => {
    const { circles } = packCircles([30, 20, 20, 10, 10, 10]);

    for (let i = 0; i < circles.length; i++) {
      const touching = circles.some((other, j) => {
        if (i === j) return false;
        const distance = Math.hypot(
          circles[i].x - other.x,
          circles[i].y - other.y,
        );
        return Math.abs(distance - circles[i].r - other.r) < 1e-4;
      });
      expect(touching).toBe(true);
    }
  });

  test("holds every circle inside the enclosing radius, centered", () => {
    const { circles, radius } = packCircles([10, 40, 25, 5, 30, 12, 18]);

    for (const c of circles) {
      expect(Math.hypot(c.x, c.y) + c.r).toBeLessThanOrEqual(radius + 1e-6);
    }
    // Not wildly loose: seven circles fit in well under the sum of radii.
    expect(radius).toBeLessThan(10 + 40 + 25 + 5 + 30 + 12 + 18);
    expect(radius).toBeGreaterThanOrEqual(40);
  });

  test("encloses two circles about as tightly as possible", () => {
    // The smallest circle around two touching circles spans both diameters.
    const { radius } = packCircles([30, 10]);

    expect(radius).toBeGreaterThanOrEqual(40);
    expect(radius).toBeLessThan(40 * 1.02);
  });

  test("keeps the padding between circles", () => {
    const { circles } = packCircles([20, 15, 10, 10, 5], { padding: 4 });

    expect(overlaps(circles, 4)).toEqual([]);
  });

  test("is deterministic", () => {
    const radii = [7, 7, 7, 7, 3, 3, 12];

    expect(packCircles(radii)).toEqual(packCircles(radii));
  });

  test("handles one circle, none, and bad radii", () => {
    expect(packCircles([9])).toEqual({
      circles: [{ x: 0, y: 0, r: 9 }],
      radius: 9,
    });
    expect(packCircles([])).toEqual({ circles: [], radius: 0 });
    const { circles } = packCircles(Object.freeze([5, -1, Number.NaN, 5]));
    expect(circles[1]).toEqual({ x: 0, y: 0, r: 0 });
    expect(circles[2]).toEqual({ x: 0, y: 0, r: 0 });
    expect(overlaps(circles)).toEqual([]);
  });
});
