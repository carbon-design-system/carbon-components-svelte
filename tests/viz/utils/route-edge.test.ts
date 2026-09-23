import {
  portPoint,
  roundedPath,
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
  const from = { x: 100, y: 50, dx: 1, dy: 0 };
  const to = { x: 300, y: 150, dx: -1, dy: 0 };

  test("leaves each port along its side, turns at the midpoint with rounded corners, and arrives head on", () => {
    const d = routePorts(from, to, { radius: 0 });
    expect(d).toBe("M100,50L116,50L200,50L200,150L284,150L300,150");
    const rounded = routePorts(from, to);
    expect(rounded.startsWith("M100,50L116,50L192,50Q200,50 200,58")).toBe(
      true,
    );
    expect(rounded.endsWith("L300,150")).toBe(true);
    expect(routePorts(from, to, { kind: "straight" })).toBe("M100,50L300,150");
  });

  test("curves as a cubic that leaves and arrives along the ports", () => {
    expect(routePorts(from, to, { kind: "curved" })).toBe(
      "M100,50C200,50 200,150 300,150",
    );
  });

  test("goes around through a lane when the target sits behind the source", () => {
    const back = { x: 100, y: 60, dx: -1, dy: 0 };
    const source = { x: 300, y: 50, dx: 1, dy: 0 };
    const d = routePorts(source, back, { radius: 0 });
    // Out to the right, up to a lane above both nodes, across, down, in.
    expect(d).toBe("M300,50L316,50L316,10L84,10L84,60L100,60");
    // Far apart vertically, the lane runs between them instead.
    const below = { x: 100, y: 300, dx: -1, dy: 0 };
    expect(routePorts(source, below, { radius: 0 })).toBe(
      "M300,50L316,50L316,175L84,175L84,300L100,300",
    );
  });

  test("shifts the channel by the offset so edges sharing a port separate", () => {
    const one = routePorts(from, to, { radius: 0, offset: -10 });
    const two = routePorts(from, to, { radius: 0, offset: 10 });
    expect(one).toContain("L190,50L190,150");
    expect(two).toContain("L210,50L210,150");
  });

  test("turns along y when leaving a top or bottom port", () => {
    const down = { x: 50, y: 100, dx: 0, dy: 1 };
    const up = { x: 250, y: 300, dx: 0, dy: -1 };
    expect(routePorts(down, up, { stub: 10, radius: 0 })).toBe(
      "M50,100L50,110L50,200L250,200L250,290L250,300",
    );
  });
});

describe("roundedPath", () => {
  test("rounds interior corners and keeps a short segment from over-rounding", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 100 },
    ];
    expect(roundedPath(points, 8)).toBe("M0,0L5,0Q10,0 10,5L10,100");
    expect(roundedPath(points.slice(0, 2), 8)).toBe("M0,0L10,0");
  });
});
