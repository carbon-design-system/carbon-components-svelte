/**
 * True when the pointer moved from `from` to `point` toward `rect`, i.e.
 * `point` is inside the triangle `from` forms with the rect's near edge.
 */
export function isAimingAt(
  point: { x: number; y: number },
  from: { x: number; y: number },
  rect: { top: number; right: number; bottom: number; left: number },
  tolerance?: number,
): boolean;
