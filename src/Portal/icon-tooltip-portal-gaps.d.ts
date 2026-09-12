export interface IconTooltipPortalGaps {
  horizontalGapLeft: number;
  horizontalGapRight: number;
  gapTop: number;
  gapBottom: number;
  verticalAlignOffsetLeft: number;
  verticalAlignOffsetRight: number;
}

/** Caret spacing + alignment nudges for an icon tooltip rendered through `PortalTooltip`. */
export function iconTooltipPortalGaps(
  tooltipPosition: "top" | "right" | "bottom" | "left",
  tooltipAlignment: "start" | "center" | "end",
): IconTooltipPortalGaps;
