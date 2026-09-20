import {
  bisectNearest,
  createGridIndex,
} from "../../../src/viz/utils/nearest-point.js";

describe("bisectNearest", () => {
  test("empty input returns -1", () => {
    expect(bisectNearest([], 5)).toBe(-1);
  });

  test("a single value always matches index 0", () => {
    expect(bisectNearest([5], -100)).toBe(0);
    expect(bisectNearest([5], 100)).toBe(0);
  });

  test("before the first value returns the first index", () => {
    expect(bisectNearest([5, 10, 15], 0)).toBe(0);
  });

  test("after the last value returns the last index", () => {
    expect(bisectNearest([5, 10, 15], 100)).toBe(2);
  });

  test("an exact hit returns that index", () => {
    expect(bisectNearest([5, 10, 15], 10)).toBe(1);
  });

  test("a midpoint tie resolves to the lower index", () => {
    expect(bisectNearest([0, 10], 5)).toBe(0);
    expect(bisectNearest([0, 10, 20, 30], 15)).toBe(1);
  });
});

// Deterministic LCG so the fuzz comparison below is reproducible.
function makeLcg(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

type Point = { x: number; y: number } | null;

function bruteForceNearestSquaredDistance(
  points: ReadonlyArray<Point>,
  x: number,
  y: number,
  maxDistance = Number.POSITIVE_INFINITY,
): number | null {
  let best: number | null = null;
  for (const point of points) {
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      continue;
    }
    const dx = point.x - x;
    const dy = point.y - y;
    const distance = dx * dx + dy * dy;
    if (distance > maxDistance * maxDistance) continue;
    if (best === null || distance < best) best = distance;
  }
  return best;
}

describe("createGridIndex", () => {
  test("empty points return -1", () => {
    expect(createGridIndex([], 50).nearest(0, 0)).toBe(-1);
  });

  test("ignores null and non-finite points", () => {
    const points: Point[] = [
      { x: 0, y: 0 },
      null,
      { x: Number.NaN, y: 5 },
      { x: 100, y: 100 },
    ];
    const index = createGridIndex(points, 50);
    expect(index.nearest(90, 90)).toBe(3);
    expect(index.nearest(1, 1)).toBe(0);
  });

  test("respects maxDistance, returning -1 when nothing is within it", () => {
    const points: Point[] = [{ x: 1000, y: 1000 }];
    const index = createGridIndex(points, 50);
    expect(index.nearest(0, 0, 10)).toBe(-1);
    expect(index.nearest(0, 0)).toBe(0);
  });

  test("a query far outside the populated area still finds the nearest point", () => {
    const points: Point[] = [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
      { x: 20, y: 5 },
    ];
    const index = createGridIndex(points, 25);
    expect(index.nearest(2000, 2000)).toBe(2);
    // Millions of empty rings away: falls back to a scan instead of walking
    // them, so this stays instant.
    const started = performance.now();
    expect(index.nearest(1e7, 1e7)).toBe(2);
    expect(index.nearest(-1e7, -1e7)).toBe(0);
    expect(performance.now() - started).toBeLessThan(200);
  });

  test("matches a brute-force nearest search over ~2,000 points and ~200 queries", () => {
    const rand = makeLcg(42);
    const points: Point[] = [];
    for (let i = 0; i < 2000; i++) {
      points.push({
        x: Math.floor(rand() * 2000),
        y: Math.floor(rand() * 2000),
      });
    }
    const index = createGridIndex(points, 50);

    for (let i = 0; i < 200; i++) {
      const x = Math.floor(rand() * 3000) - 500;
      const y = Math.floor(rand() * 3000) - 500;
      const found = index.nearest(x, y);
      const expectedDistance = bruteForceNearestSquaredDistance(points, x, y);
      expect(found).not.toBe(-1);
      const point = points[found] as { x: number; y: number };
      const dx = point.x - x;
      const dy = point.y - y;
      expect(dx * dx + dy * dy).toBe(expectedDistance);
    }
  });
});
