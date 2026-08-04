import type { RectLike } from "./floatingPosition.js";

export type ListBoxDirection = "bottom" | "top" | "auto";

export interface ResolveListBoxDirectionGeometry {
  anchorRect: RectLike;
  floatingRect: RectLike;
  viewport: {
    innerWidth: number;
    innerHeight: number;
    scrollX?: number;
    scrollY?: number;
  };
}

/**
 * Resolve a list-box menu direction. `"auto"` prefers `"bottom"` and flips
 * to `"top"` when the menu would clip the viewport.
 */
export function resolveListBoxDirection(
  direction: ListBoxDirection,
  geometry?: ResolveListBoxDirectionGeometry,
): "bottom" | "top";
