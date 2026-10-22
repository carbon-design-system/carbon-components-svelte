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
 * Round every interior corner of a polyline with a quadratic curve of the
 * given radius, shortened where a segment is too short for it.
 *
 * @param {ReadonlyArray<{ x: number; y: number }>} points
 * @param {number} radius
 * @returns {string}
 */
export function roundedPath(points, radius) {
  if (points.length === 0) return "";
  let d = `M${r(points[0].x)},${r(points[0].y)}`;
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const at = points[i];
    const next = points[i + 1];
    const inLen = Math.hypot(at.x - prev.x, at.y - prev.y);
    const outLen = Math.hypot(next.x - at.x, next.y - at.y);
    const rr = Math.min(radius, inLen / 2, outLen / 2);
    // A corner that does not turn stays a plain point.
    const turns =
      inLen > 0 &&
      outLen > 0 &&
      Math.abs(
        (at.x - prev.x) * (next.y - at.y) - (at.y - prev.y) * (next.x - at.x),
      ) > 1e-6;
    if (rr <= 0.5 || !turns) {
      d += `L${r(at.x)},${r(at.y)}`;
      continue;
    }
    const a = {
      x: at.x - ((at.x - prev.x) / inLen) * rr,
      y: at.y - ((at.y - prev.y) / inLen) * rr,
    };
    const b = {
      x: at.x + ((next.x - at.x) / outLen) * rr,
      y: at.y + ((next.y - at.y) / outLen) * rr,
    };
    d += `L${r(a.x)},${r(a.y)}Q${r(at.x)},${r(at.y)} ${r(b.x)},${r(b.y)}`;
  }
  const last = points[points.length - 1];
  if (points.length > 1) d += `L${r(last.x)},${r(last.y)}`;
  return d;
}

/**
 * A path from one port to another. Straight runs point to point. Curved
 * is a cubic that leaves and arrives along the ports' sides. Orthogonal
 * leaves each port along its side for a stub, turns at the midpoint
 * between the stubs with rounded corners, and when the target sits
 * behind the source it goes around through a lane above or beside the
 * nodes rather than back through them. `offset` shifts the crossing
 * channel, so edges sharing a port take different channels.
 *
 * @param {{ x: number; y: number; dx: number; dy: number }} from
 * @param {{ x: number; y: number; dx: number; dy: number }} to
 * @param {import("./route-edge.d.ts").RoutePortsOptions} [options]
 * @returns {string}
 */
export function routePorts(from, to, options = {}) {
  const {
    kind = "orthogonal",
    stub = 16,
    radius = 8,
    offset = 0,
    lane = 40,
  } = options;
  if (kind === "straight") {
    return `M${r(from.x)},${r(from.y)}L${r(to.x)},${r(to.y)}`;
  }
  if (kind === "curved") {
    const reach = Math.max(
      40,
      Math.abs(from.dx === 0 ? to.y - from.y : to.x - from.x) / 2,
    );
    const c1 = { x: from.x + from.dx * reach, y: from.y + from.dy * reach };
    const c2 = { x: to.x + to.dx * reach, y: to.y + to.dy * reach };
    return `M${r(from.x)},${r(from.y)}C${r(c1.x)},${r(c1.y)} ${r(c2.x)},${r(c2.y)} ${r(to.x)},${r(to.y)}`;
  }
  const a = { x: from.x + from.dx * stub, y: from.y + from.dy * stub };
  const b = { x: to.x + to.dx * stub, y: to.y + to.dy * stub };
  /** @type {Array<{ x: number; y: number }>} */
  const points = [from, a];
  if (from.dx === 0) {
    const forward = from.dy > 0 ? b.y >= a.y : b.y <= a.y;
    if (forward) {
      const mid = (a.y + b.y) / 2 + offset;
      points.push({ x: a.x, y: mid }, { x: b.x, y: mid });
    } else {
      const apart = Math.abs(to.x - from.x) >= lane * 2;
      const laneX = apart
        ? (from.x + to.x) / 2 + offset
        : Math.min(from.x, to.x) - lane - offset;
      points.push({ x: laneX, y: a.y }, { x: laneX, y: b.y });
    }
  } else {
    // Leaving sideways. Forward: cross halfway along x. Backward: the
    // target is behind, so climb to a lane, cross, and come back down.
    const forward = from.dx > 0 ? b.x >= a.x : b.x <= a.x;
    if (forward) {
      const mid = (a.x + b.x) / 2 + offset;
      points.push({ x: mid, y: a.y }, { x: mid, y: b.y });
    } else {
      const apart = Math.abs(to.y - from.y) >= lane * 2;
      const laneY = apart
        ? (from.y + to.y) / 2 + offset
        : Math.min(from.y, to.y) - lane - offset;
      points.push({ x: a.x, y: laneY }, { x: b.x, y: laneY });
    }
  }
  points.push(b, to);
  return roundedPath(points, radius);
}
