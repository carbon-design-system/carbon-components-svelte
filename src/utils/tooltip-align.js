// @ts-check
// `tooltipAlign` names a tooltip's placement in floating-ui form, as
// Popover's `align` does: the side, then `start` or `end` along that side.
// It splits into the older `tooltipPosition` and `tooltipAlignment` pair, so
// every component keeps its own placement and RTL logic. On the top and
// bottom, that logic swaps `start` and `end` under `dir="rtl"`. On the left
// and right they align on the block axis and stay.

const SIDES = new Set(["top", "right", "bottom", "left"]);
const EDGES = new Set(["start", "end"]);

/**
 * The tooltip position and alignment for a `tooltipAlign` value. A set,
 * valid `tooltipAlign` wins; otherwise the older props pass through.
 *
 * @template {string | undefined} Position
 * @template {string | undefined} Alignment
 * @param {string | undefined} align `tooltipAlign`, such as `"top-start"`.
 * @param {Position} position The older `tooltipPosition`.
 * @param {Alignment} alignment The older `tooltipAlignment`.
 * @returns {{ position: Position | "top" | "right" | "bottom" | "left"; alignment: Alignment | "start" | "center" | "end" }}
 */
export function tooltipPlacement(align, position, alignment) {
  if (!align) return { position, alignment };
  const [side, edge, extra] = align.split("-");
  if (!SIDES.has(side) || extra !== undefined) return { position, alignment };
  if (edge !== undefined && !EDGES.has(edge)) return { position, alignment };
  return {
    position: /** @type {"top" | "right" | "bottom" | "left"} */ (side),
    alignment: /** @type {"start" | "end" | undefined} */ (edge) ?? "center",
  };
}
