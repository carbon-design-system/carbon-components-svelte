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

export { physicalAlign } from "./inline-align";
