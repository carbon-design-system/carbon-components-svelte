/**
 * The physical side of a `start` or `end` alignment on the inline axis.
 * They swap in RTL, where the inline start is the right. `center` stays.
 * Returns `start` for the left edge and `end` for the right.
 */
export function physicalAlign(
  align: "start" | "center" | "end",
  rtl: boolean,
): "start" | "center" | "end";

/**
 * Whether a popover placement aligns to an inline side, so it swaps in RTL:
 * `top-start`, `top-end`, `bottom-start` and `bottom-end`.
 */
export function isInlineAlign(align: string): boolean;

/**
 * The physical placement of a popover `align`, named as the older placements
 * (`top-left`, `left-bottom`). Carbon v11's `top-start` is `top-left` in LTR
 * and `top-right` in RTL. `left-start` and `right-start` align on the block
 * axis, so they stay. The older names and the bare sides are physical
 * already.
 */
export function popoverPlacement(align: string, rtl: boolean): string;
