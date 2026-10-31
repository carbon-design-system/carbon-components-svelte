import { geoPaths } from "../../../src/viz/utils/geo-path.js";

const square = (x: number, y: number, size: number) => [
  [
    [x, y],
    [x + size, y],
    [x + size, y + size],
    [x, y + size],
    [x, y],
  ],
];
const west = {
  id: "west",
  geometry: { type: "Polygon" as const, coordinates: square(0, 0, 10) },
};
const east = {
  id: "east",
  geometry: { type: "Polygon" as const, coordinates: square(10, 0, 10) },
};
const box = { width: 400, height: 200, projection: "equirectangular" as const };

describe("geoPaths", () => {
  test("fits the features in the box, keeping proportions and centering", () => {
    const [a, b] = geoPaths([west, east], box);

    // 20 by 10 degrees in 400 by 200 pixels: 20 pixels a degree, no slack.
    expect(a.path).toBe("M0,200L200,200L200,0L0,0L0,200Z");
    expect(b.path.startsWith("M200,200")).toBe(true);
    expect([a.cx, a.cy]).toEqual([100, 100]);
    expect([b.cx, b.cy]).toEqual([300, 100]);
  });

  test("centers on the short side and honors padding", () => {
    const [only] = geoPaths([west], { ...box, padding: 10 });

    // A 10 degree square in 380 by 180: 18 pixels a degree, centered across.
    expect(only.path.startsWith("M110,190L290,190")).toBe(true);
    expect([only.cx, only.cy]).toEqual([200, 100]);
  });

  test("puts north up, and stretches latitude under mercator", () => {
    const north = {
      id: "n",
      geometry: { type: "Polygon" as const, coordinates: square(0, 60, 10) },
    };
    const south = {
      id: "s",
      geometry: { type: "Polygon" as const, coordinates: square(0, 0, 10) },
    };
    const [n, s] = geoPaths([north, south], {
      width: 100,
      height: 1000,
      projection: "mercator",
    });
    const heights = [n, s].map((shape) => {
      const ys = [...shape.path.matchAll(/,(-?[\d.]+)/g)].map((m) =>
        Number(m[1]),
      );
      return Math.max(...ys) - Math.min(...ys);
    });

    expect(n.cy).toBeLessThan(s.cy);
    // Ten degrees near 65 north is drawn far taller than ten at the equator.
    expect(heights[0]).toBeGreaterThan(heights[1] * 2);
  });

  test("writes every ring of a multi polygon, holes included", () => {
    const islands = {
      id: "i",
      geometry: {
        type: "MultiPolygon" as const,
        coordinates: [
          [...square(0, 0, 10), ...square(4, 4, 2)],
          square(20, 0, 5),
        ],
      },
    };
    const [shape] = geoPaths([islands], box);

    expect(shape.path.match(/M/g)).toHaveLength(3);
    expect(shape.path.match(/Z/g)).toHaveLength(3);
  });

  test("takes a feature collection, and skips what has no area", () => {
    const shapes = geoPaths(
      {
        type: "FeatureCollection",
        features: [
          west,
          { id: "point", geometry: { type: "Point", coordinates: [5, 5] } },
          { id: "none", geometry: null },
        ],
      },
      box,
    );

    expect(shapes.map((shape) => shape.path !== "")).toEqual([
      true,
      false,
      false,
    ]);
    expect(shapes[1]).toMatchObject({ cx: 0, cy: 0, index: 1 });
  });

  test("handles nothing to draw", () => {
    expect(geoPaths([], box)).toEqual([]);
  });
});
