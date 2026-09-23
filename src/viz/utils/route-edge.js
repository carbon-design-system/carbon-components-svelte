// @ts-check
// Edge paths: through a polyline, or with right angles that turn halfway
// between the ends, and between two ports on the sides of nodes.

/** @param {number} value */
function r(value) {
  return Math.round(value * 100) / 100;
}

/**
 * A path through the points: straight, or orthogonal with one elbow
 * halfway along `axis` between consecutive points.
 *
 * @param {ReadonlyArray<{ x: number; y: number }>} points
 * @param {{ kind?: "straight" | "orthogonal"; axis?: "x" | "y" }} [options]
 * @returns {string}
 */
export function routePolyline(points, options = {}) {
  const { kind = "straight", axis = "y" } = options;
  if (points.length === 0) return "";
  if (kind !== "orthogonal" || points.length < 2) {
    return points
      .map((point, i) => `${i === 0 ? "M" : "L"}${r(point.x)},${r(point.y)}`)
      .join("");
  }
  let d = `M${r(points[0].x)},${r(points[0].y)}`;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (axis === "x") {
      const mid = (a.x + b.x) / 2;
      d += `L${r(mid)},${r(a.y)}L${r(mid)},${r(b.y)}L${r(b.x)},${r(b.y)}`;
    } else {
      const mid = (a.y + b.y) / 2;
      d += `L${r(a.x)},${r(mid)}L${r(b.x)},${r(mid)}L${r(b.x)},${r(b.y)}`;
    }
  }
  return d;
}

/**
 * The point on a node's edge where a port sits, and the direction an edge
 * leaves it.
 *
 * @param {{ x: number; y: number; width: number; height: number }} node
 * @param {import("./route-edge.d.ts").PortSide} side
 * @param {number} [at] Position along the side, 0 to 1. @default 0.5
 * @returns {{ x: number; y: number; dx: number; dy: number }}
 */
export function portPoint(node, side, at = 0.5) {
  switch (side) {
    case "top":
      return { x: node.x + node.width * at, y: node.y, dx: 0, dy: -1 };
    case "bottom":
      return {
        x: node.x + node.width * at,
        y: node.y + node.height,
        dx: 0,
        dy: 1,
      };
    case "left":
      return { x: node.x, y: node.y + node.height * at, dx: -1, dy: 0 };
    default:
      return {
        x: node.x + node.width,
        y: node.y + node.height * at,
        dx: 1,
        dy: 0,
      };
  }
}

/**
 * A path from one port to another. Straight runs point to point. The
 * orthogonal route leaves each port along its side for a stub, then turns
 * at the midpoint between the stubs, so an edge never runs back through
 * its own node.
 *
 * @param {{ x: number; y: number; dx: number; dy: number }} from
 * @param {{ x: number; y: number; dx: number; dy: number }} to
 * @param {{ kind?: "straight" | "orthogonal"; stub?: number }} [options]
 * @returns {string}
 */
export function routePorts(from, to, options = {}) {
  const { kind = "orthogonal", stub = 16 } = options;
  if (kind === "straight") {
    return `M${r(from.x)},${r(from.y)}L${r(to.x)},${r(to.y)}`;
  }
  const a = { x: from.x + from.dx * stub, y: from.y + from.dy * stub };
  const b = { x: to.x + to.dx * stub, y: to.y + to.dy * stub };
  /** @type {Array<{ x: number; y: number }>} */
  const points = [from, a];
  if (from.dx === 0) {
    const mid = (a.y + b.y) / 2;
    points.push({ x: a.x, y: mid }, { x: b.x, y: mid });
  } else {
    // Leaving sideways: cross halfway along x, then align on y.
    const mid = (a.x + b.x) / 2;
    points.push({ x: mid, y: a.y }, { x: mid, y: b.y });
  }
  points.push(b, to);
  return points
    .map((point, i) => `${i === 0 ? "M" : "L"}${r(point.x)},${r(point.y)}`)
    .join("");
}
