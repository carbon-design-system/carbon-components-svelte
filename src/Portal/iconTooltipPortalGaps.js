// @ts-check

// Caret spacing + alignment nudges for an icon tooltip rendered through
// `PortalTooltip`. Shared by `CopyButton` and `CodeSnippet`'s inline copy
// feedback so the portalled caret sits the same distance from the trigger
// across components. Mirrors Button's icon tooltip.
const PORTAL_HORIZONTAL_GAP_PX = 2;
const PORTAL_VERTICAL_GAP_PX = 1;
const PORTAL_VERTICAL_ALIGN_OFFSET_LEFT_START_PX = -3;
const PORTAL_VERTICAL_ALIGN_OFFSET_RIGHT_END_PX = 1;

/**
 * @param {"top" | "right" | "bottom" | "left"} tooltipPosition
 * @param {"start" | "center" | "end"} tooltipAlignment
 * @returns {{
 *   horizontalGapLeft: number,
 *   horizontalGapRight: number,
 *   gapTop: number,
 *   gapBottom: number,
 *   verticalAlignOffsetLeft: number,
 *   verticalAlignOffsetRight: number,
 * }}
 */
export function iconTooltipPortalGaps(tooltipPosition, tooltipAlignment) {
  const horizontal = tooltipPosition === "left" || tooltipPosition === "right";
  const vertical = tooltipPosition === "top" || tooltipPosition === "bottom";
  return {
    horizontalGapLeft: horizontal ? PORTAL_HORIZONTAL_GAP_PX : 0,
    horizontalGapRight: horizontal ? PORTAL_HORIZONTAL_GAP_PX : 0,
    gapTop: vertical ? PORTAL_VERTICAL_GAP_PX : 0,
    gapBottom: vertical ? PORTAL_VERTICAL_GAP_PX : 0,
    verticalAlignOffsetLeft:
      tooltipPosition === "left" && tooltipAlignment === "start"
        ? PORTAL_VERTICAL_ALIGN_OFFSET_LEFT_START_PX
        : 0,
    verticalAlignOffsetRight:
      tooltipPosition === "right" && tooltipAlignment === "end"
        ? PORTAL_VERTICAL_ALIGN_OFFSET_RIGHT_END_PX
        : 0,
  };
}
