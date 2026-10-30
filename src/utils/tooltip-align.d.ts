/** A tooltip placement in floating-ui form, as Popover's `align` takes. */
export type TooltipAlign =
  | "top"
  | "top-start"
  | "top-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "left"
  | "left-start"
  | "left-end"
  | "right"
  | "right-start"
  | "right-end";

/**
 * The tooltip position and alignment for a `tooltipAlign` value. A set,
 * valid `tooltipAlign` wins; otherwise the older props pass through.
 * On the top and bottom, `start` and `end` name inline sides, and the
 * component's own logic swaps them under `dir="rtl"`. On the left and
 * right they name the block start and end, and stay.
 */
export function tooltipPlacement<
  Position extends string | undefined,
  Alignment extends string | undefined,
>(
  align: string | undefined,
  position: Position,
  alignment: Alignment,
): {
  position: Position | "top" | "right" | "bottom" | "left";
  alignment: Alignment | "start" | "center" | "end";
};
