/**
 * Place a menu along one viewport axis: toward the far end from `after`,
 * else back from `before`, else pinned to the far edge. `reverse` swaps
 * the preference (the inline axis of an RTL page). Returns the menu's
 * near edge.
 */
export function fitMenuAxis(options: {
  /** Near edge of the anchor (left or top). */
  before: number;
  /** Far edge of the anchor (right or bottom). Equal to `before` for a pointer. */
  after: number;
  size: number;
  max: number;
  /** @default false */
  reverse?: boolean;
}): number;

/**
 * The physical side of a `start` or `end` alignment along the inline axis:
 * `start` for the left edge, `end` for the right. They swap in RTL.
 */
export function physicalAlign(
  align: "start" | "center" | "end",
  rtl: boolean,
): "start" | "center" | "end";
