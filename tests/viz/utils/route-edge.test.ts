import {
  portPoint,
  routePolyline,
  routePorts,
} from "../../../src/viz/utils/route-edge.js";

describe("routePolyline", () => {
  test("joins points straight, or with an elbow halfway along the axis", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 100, y: 50 },
    ];
    expect(routePolyline(points)).toBe("M0,0L100,50");
    expect(routePolyline(points, { kind: "orthogonal" })).toBe(
      "M0,0L0,25L100,25L100,50",
    );
    expect(routePolyline(points, { kind: "orthogonal", axis: "x" })).toBe(
      "M0,0L50,0L50,50L100,50",
    );
    expect(routePolyline([])).toBe("");
  });
});

describe("portPoint", () => {
  test("places a port on each side, pointing outward", () => {
    const node = { x: 10, y: 20, width: 100, height: 40 };
    expect(portPoint(node, "right")).toEqual({ x: 110, y: 40, dx: 1, dy: 0 });
    expect(portPoint(node, "left", 0.25)).toEqual({
      x: 10,
      y: 30,
      dx: -1,
      dy: 0,
    });
    expect(portPoint(node, "top")).toEqual({ x: 60, y: 20, dx: 0, dy: -1 });
    expect(portPoint(node, "bottom")).toEqual({ x: 60, y: 60, dx: 0, dy: 1 });
  });
});

describe("routePorts", () => {
  test("leaves each port along its side, turns at the midpoint, and arrives head on", () => {
    const from = { x: 100, y: 50, dx: 1, dy: 0 };
    const to = { x: 300, y: 150, dx: -1, dy: 0 };
    expect(routePorts(from, to)).toBe(
      "M100,50L116,50L200,50L200,150L284,150L300,150",
    );
    expect(routePorts(from, to, { kind: "straight" })).toBe("M100,50L300,150");
  });

  test("routes a backward edge out and around rather than through the nodes", () => {
    const from = { x: 300, y: 50, dx: 1, dy: 0 };
    const to = { x: 100, y: 150, dx: -1, dy: 0 };
    const d = routePorts(from, to, { stub: 20 });
    expect(d.startsWith("M300,50L320,50")).toBe(true);
    expect(d.endsWith("L80,150L100,150")).toBe(true);
  });

  test("turns along y when leaving a top or bottom port", () => {
    const from = { x: 50, y: 100, dx: 0, dy: 1 };
    const to = { x: 250, y: 300, dx: 0, dy: -1 };
    expect(routePorts(from, to, { stub: 10 })).toBe(
      "M50,100L50,110L50,200L250,200L250,290L250,300",
    );
  });
});
