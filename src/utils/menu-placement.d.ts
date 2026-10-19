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
 * `direction` when the anchor or menu has no layout (zero size), or the
 * anchor is out of the window.
 */
export function menuSide(
  anchor: Element,
  menu: Element,
  direction: "top" | "bottom",
): "top" | "bottom";

/**
 * Align a menu above or below its anchor so it stays `margin` px (8 by
 * default) inside the viewport's sides. A menu that fits keeps `align`;
 * one that runs past a side takes the alignment that runs past least.
 * Physical names: `start` is the anchor's left edge, `end` its right edge.
 */
export function fitIntrinsicAlign(options: {
  /** The anchor's left edge. */
  before: number;
  /** The anchor's right edge. */
  after: number;
  /** The menu's width. */
  size: number;
  /** The viewport's width. */
  max: number;
  /** The preferred alignment. */
  align: "start" | "center" | "end";
  /** @default 8 */
  margin?: number;
}): "start" | "center" | "end";

export { physicalAlign } from "./inline-align";
