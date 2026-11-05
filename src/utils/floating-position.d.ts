export type RectLike = {
  top: number;
  bottom: number;
  left: number;
  right: number;
  width: number;
  height: number;
};

export type FloatingDirection = "bottom" | "top" | "left" | "right";

export interface FloatingPositionOptions {
  /** The anchor's `getBoundingClientRect()`. */
  anchorRect: RectLike;
  /** The floating element's `getBoundingClientRect()`. */
  floatingRect: RectLike;
  viewport: {
    innerWidth: number;
    innerHeight: number;
    scrollX: number;
    scrollY: number;
  };
  /** Preferred direction. */
  direction: FloatingDirection;
  /** When set, skip flip detection and place on this side. Keeps a side stable across content changes while the floating element stays open. */
  lockedDirection?: FloatingDirection;
  /** When true, scroll offsets are zeroed (caller uses `position: fixed`). */
  useFixedPosition?: boolean;
  /** Use the floating element's own width instead of matching the anchor. */
  intrinsicWidth?: boolean;
  /** Alignment along the anchor edge when `intrinsicWidth` is true. */
  intrinsicAlign?: "start" | "center" | "end";
  gapTop?: number;
  gapBottom?: number;
  horizontalGapLeft?: number;
  horizontalGapRight?: number;
  verticalAlignOffsetLeft?: number;
  verticalAlignOffsetRight?: number;
  /** Take another alignment along the anchor edge when the box runs past the viewport. `"any"` also tries center. */
  flipAlign?: boolean | "any";
  /** When neither side along `direction` has room, open across the anchor. */
  flipAxis?: boolean;
  /** Room kept inside the viewport along the anchor's edge, when fitting the alignment or reporting a slide. */
  padding?: number;
  /** Report how far the box would have to slide to sit this far inside the viewport. The box is not moved. */
  shift?: number | false;
}

export interface FloatingPositionResult {
  top: number;
  left: number;
  width?: number;
  actualDirection: FloatingDirection;
  /** The alignment it settled on. */
  actualAlign: "start" | "center" | "end";
  /** How far the box would slide to stay inside, when `shift` is set. */
  shiftX: number;
  /** Whether the box's real width decided the placement. */
  exact: boolean;
  caretNudgePx?: number;
}

/** Place a floating element next to an anchor; flip when the preferred side does not fit. */
export function floatingPosition(
  options: FloatingPositionOptions,
): FloatingPositionResult;
