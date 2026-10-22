import {
  contours,
  densityGrid,
  levelsFor,
} from "../../../src/viz/utils/contour.js";

describe("densityGrid", () => {
  test("piles weight around each point and peaks where points cluster", () => {
    const points = [
      { x: 50, y: 50 },
      { x: 52, y: 48 },
      { x: 150, y: 50 },
      null,
    ];
    const grid = densityGrid(points, {
      width: 200,
      height: 100,
      cellSize: 10,
      bandwidth: 10,
    });
    expect(grid.columns).toBe(21);
    expect(grid.rows).toBe(11);
    const at = (x: number, y: number) =>
      grid.values[(y / 10) * grid.columns + x / 10];
    expect(at(50, 50)).toBeGreaterThan(at(150, 50));
    expect(at(150, 50)).toBeGreaterThan(at(100, 50));
    expect(grid.peak).toBeGreaterThanOrEqual(at(50, 50));
    // Far from every point the density is nothing.
    expect(at(0, 100)).toBeCloseTo(0, 6);
  });
});

describe("contours", () => {
  test("draws a closed ring around a single peak, and nothing at a level above it", () => {
    const grid = densityGrid([{ x: 50, y: 50 }], {
      width: 100,
      height: 100,
      cellSize: 5,
      bandwidth: 10,
    });
    const [half, above] = contours(grid, [grid.peak * 0.5, grid.peak * 2]);
    expect(half.d).toMatch(/^M/);
    const segments = half.d.split("M").filter(Boolean);
    // A ring around one peak needs a good number of segments, all near it.
    expect(segments.length).toBeGreaterThan(8);
    for (const segment of segments) {
      const [x, y] = segment.split("L")[0].split(",").map(Number);
      expect(Math.hypot(x - 50, y - 50)).toBeLessThan(30);
    }
    expect(above.d).toBe("");
  });

  test("spaces levels from a share of the peak up to it", () => {
    expect(levelsFor(10, 4)).toEqual([1, 3.25, 5.5, 7.75]);
    expect(levelsFor(10, 2, 0.5)).toEqual([5, 7.5]);
    expect(levelsFor(0, 3)).toEqual([]);
  });
});
