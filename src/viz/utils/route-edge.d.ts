export type PortSide = "top" | "right" | "bottom" | "left";

/** A path through the points, straight or with one elbow between each pair. */
export function routePolyline(
  points: ReadonlyArray<{ x: number; y: number }>,
  options?: { kind?: "straight" | "orthogonal"; axis?: "x" | "y" },
): string;

/** Where a port sits on a node's side, and the direction an edge leaves it. */
export function portPoint(
  node: { x: number; y: number; width: number; height: number },
  side: PortSide,
  at?: number,
): { x: number; y: number; dx: number; dy: number };

export type RoutePortsOptions = {
  /** @default "orthogonal" */
  kind?: "straight" | "orthogonal" | "curved";
  /** How far an orthogonal edge leaves a port before turning. @default 16 */
  stub?: number;
  /** Corner radius of an orthogonal edge. @default 8 */
  radius?: number;
  /** Shift of the crossing channel, so edges sharing a port separate. @default 0 */
  offset?: number;
  /** Distance of the detour lane when the target sits behind the source. @default 40 */
  lane?: number;
};

/** A polyline with rounded corners. */
export function roundedPath(
  points: ReadonlyArray<{ x: number; y: number }>,
  radius: number,
): string;

/** A path from one port to another: straight, curved, or orthogonal. */
export function routePorts(
  from: { x: number; y: number; dx: number; dy: number },
  to: { x: number; y: number; dx: number; dy: number },
  options?: RoutePortsOptions,
): string;
