import { hexagonPath, hexbin } from "../../../src/viz/utils/hexbin.js";

describe("hexbin", () => {
  test("draws a pointy-top hexagon path", () => {
    const d = hexagonPath(10);
    expect(d).toMatch(/^M0,-10L8\.66,-5L8\.66,5L0,10L-8\.66,5L-8\.66,-5Z$/);
  });

  test("puts points into the hexagon whose center is nearest, counting them", () => {
    const bins = hexbin(
      [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 100, y: 100 },
        null,
        { x: Number.NaN, y: 0 },
      ],
      10,
    );
    expect(bins).toHaveLength(2);
    expect(bins[0]).toMatchObject({ x: 0, y: 0, count: 2, indices: [0, 1] });
    expect(bins[1].count).toBe(1);
    // The second bin's center is within a radius of the point.
    expect(Math.hypot(bins[1].x - 100, bins[1].y - 100)).toBeLessThanOrEqual(
      10,
    );
  });

  test("keeps every point within a radius of its bin center, and tiles without gaps", () => {
    const radius = 8;
    const points = Array.from({ length: 500 }, (_, i) => ({
      x: (i * 7919) % 200,
      y: (i * 104729) % 120,
    }));
    const bins = hexbin(points, radius);
    let total = 0;
    for (const bin of bins) {
      total += bin.count;
      for (const index of bin.indices) {
        const point = points[index];
        expect(
          Math.hypot(point.x - bin.x, point.y - bin.y),
        ).toBeLessThanOrEqual(radius + 1e-9);
      }
    }
    expect(total).toBe(500);
    // Centers of neighboring bins sit a column step or a row step apart.
    const dx = radius * Math.sqrt(3);
    const xs = [
      ...new Set(bins.map((bin) => Math.round(bin.y / (radius * 1.5)))),
    ];
    expect(xs.length).toBeGreaterThan(5);
    const sameRow = bins
      .filter((bin) => bin.y === bins[0].y)
      .map((bin) => bin.x)
      .sort((a, b) => a - b);
    for (let i = 1; i < sameRow.length; i++) {
      expect((sameRow[i] - sameRow[i - 1]) / dx).toBeCloseTo(
        Math.round((sameRow[i] - sameRow[i - 1]) / dx),
        5,
      );
    }
  });
});
