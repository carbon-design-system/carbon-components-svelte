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

/** A path from one port to another, with stubs and a midpoint turn. */
export function routePorts(
  from: { x: number; y: number; dx: number; dy: number },
  to: { x: number; y: number; dx: number; dy: number },
  options?: { kind?: "straight" | "orthogonal"; stub?: number },
): string;
