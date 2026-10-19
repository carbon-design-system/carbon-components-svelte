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
 * The side a menu opens on in place: `direction`, unless the menu doesn't
 * fit on that side of the window and the other side has more room. Keeps
 * `direction` when the anchor or menu has no layout (zero size).
 */
export function menuSide(
  anchor: Element,
  menu: Element,
  direction: "top" | "bottom",
): "top" | "bottom";

export { physicalAlign } from "./inline-align";
