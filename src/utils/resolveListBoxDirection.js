// @ts-check

import { floatingPosition } from "./floatingPosition.js";

/**
 * @typedef {import("./floatingPosition.js").RectLike} RectLike
 */

/**
 * Resolve a list-box menu direction. `"auto"` prefers `"bottom"` and flips
 * to `"top"` when the menu would clip the viewport (same rules as
 * {@link floatingPosition}).
 *
 * @param {"bottom" | "top" | "auto"} direction
 * @param {Object} [geometry] - Required to evaluate `"auto"` against the viewport.
 * @param {RectLike} geometry.anchorRect
 * @param {RectLike} geometry.floatingRect
 * @param {{ innerWidth: number, innerHeight: number, scrollX?: number, scrollY?: number }} geometry.viewport
 * @returns {"bottom" | "top"}
 */
export function resolveListBoxDirection(direction, geometry) {
  if (direction === "top" || direction === "bottom") {
    return direction;
  }

  if (!geometry) {
    return "bottom";
  }

  const { actualDirection } = floatingPosition({
    anchorRect: geometry.anchorRect,
    floatingRect: geometry.floatingRect,
    viewport: {
      innerWidth: geometry.viewport.innerWidth,
      innerHeight: geometry.viewport.innerHeight,
      scrollX: geometry.viewport.scrollX ?? 0,
      scrollY: geometry.viewport.scrollY ?? 0,
    },
    direction: "bottom",
  });

  return actualDirection === "top" ? "top" : "bottom";
}
