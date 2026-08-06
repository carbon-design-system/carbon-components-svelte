// @ts-check

/**
 * @typedef {{ top: number, bottom: number, left: number, right: number, width: number, height: number }} RectLike
 */

/**
 * Place a floating element next to an anchor. Caller passes both rects and the
 * viewport. Flips direction when the preferred side does not fit, then shifts
 * (clamps) the box to stay within the viewport on the cross axis - there is
 * no "other side" to flip to there, so this is a shift rather than a flip,
 * same as Floating UI's `shift`. For `left`/`right`, the primary axis also
 * gets a final clamp as a fallback for when content is too wide for either
 * side to fully fit.
 *
 * @param {Object} options
 * @param {RectLike} options.anchorRect - The anchor's `getBoundingClientRect()`.
 * @param {RectLike} options.floatingRect - The floating element's `getBoundingClientRect()`.
 * @param {{ innerWidth: number, innerHeight: number, scrollX: number, scrollY: number }} options.viewport
 * @param {"bottom" | "top" | "left" | "right"} options.direction - Preferred direction.
 * @param {"bottom" | "top" | "left" | "right"} [options.lockedDirection] - When set, skip flip detection and place on this side. Used to keep a side stable across content (width/height) changes while the floating element stays open.
 * @param {boolean} [options.useFixedPosition=false] - When true, scroll offsets are zeroed (the caller positions with `position: fixed`).
 * @param {boolean} [options.intrinsicWidth=false] - Use the floating element's own width instead of matching the anchor.
 * @param {"start" | "center" | "end"} [options.intrinsicAlign="center"] - Alignment along the anchor edge when `intrinsicWidth` is true.
 * @param {number} [options.gapTop=0]
 * @param {number} [options.gapBottom=0]
 * @param {number} [options.horizontalGapLeft=0]
 * @param {number} [options.horizontalGapRight=0]
 * @param {number} [options.verticalAlignOffsetLeft=0]
 * @param {number} [options.verticalAlignOffsetRight=0]
 * @returns {{ top: number, left: number, width?: number, actualDirection: "bottom" | "top" | "left" | "right", caretNudgePx?: number }}
 */
export function floatingPosition({
  anchorRect: rect,
  floatingRect,
  viewport,
  direction,
  lockedDirection,
  useFixedPosition = false,
  intrinsicWidth = false,
  intrinsicAlign = "center",
  gapTop = 0,
  gapBottom = 0,
  horizontalGapLeft = 0,
  horizontalGapRight = 0,
  verticalAlignOffsetLeft = 0,
  verticalAlignOffsetRight = 0,
}) {
  const scrollYOffset = useFixedPosition ? 0 : viewport.scrollY;
  const scrollXOffset = useFixedPosition ? 0 : viewport.scrollX;

  const isVertical = direction === "top" || direction === "bottom";
  let actualDirection = direction;

  if (lockedDirection) {
    // Caller is keeping a previously-chosen side stable (e.g. a tooltip whose
    // text — and thus width/height — swaps while open). Skip flip detection so
    // the floating element does not jump to the opposite side mid-session.
    actualDirection = lockedDirection;
  } else if (isVertical) {
    const spaceBelow = viewport.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (
      direction === "bottom" &&
      spaceBelow < floatingRect.height &&
      spaceAbove > spaceBelow
    ) {
      actualDirection = "top";
    } else if (
      direction === "top" &&
      spaceAbove < floatingRect.height &&
      spaceBelow > spaceAbove
    ) {
      actualDirection = "bottom";
    }
  } else {
    const spaceRight = viewport.innerWidth - rect.right;
    const spaceLeft = rect.left;

    if (
      direction === "right" &&
      spaceRight < floatingRect.width + horizontalGapRight &&
      spaceLeft > spaceRight
    ) {
      actualDirection = "left";
    } else if (
      direction === "left" &&
      spaceLeft < floatingRect.width + horizontalGapLeft &&
      spaceRight > spaceLeft
    ) {
      actualDirection = "right";
    }
  }

  /** @type {number} */
  let top;
  /** @type {number} */
  let left;
  /** @type {number | undefined} */
  let width;

  if (actualDirection === "bottom") {
    top = rect.bottom + scrollYOffset + gapBottom;
    left = rect.left + scrollXOffset;
    width = rect.width;
  } else if (actualDirection === "top") {
    top = rect.top + scrollYOffset - floatingRect.height - gapTop;
    left = rect.left + scrollXOffset;
    width = rect.width;
  } else if (actualDirection === "right") {
    if (intrinsicWidth) {
      if (intrinsicAlign === "start") {
        top = rect.top + scrollYOffset + verticalAlignOffsetRight;
      } else if (intrinsicAlign === "end") {
        top =
          rect.bottom +
          scrollYOffset -
          floatingRect.height +
          verticalAlignOffsetRight;
      } else {
        top =
          rect.top +
          scrollYOffset +
          rect.height / 2 -
          floatingRect.height / 2 +
          verticalAlignOffsetRight;
      }
    } else {
      top =
        rect.top +
        scrollYOffset +
        rect.height / 2 -
        floatingRect.height / 2 +
        verticalAlignOffsetRight;
    }
    left = rect.right + scrollXOffset + horizontalGapRight;
  } else {
    // left
    if (intrinsicWidth) {
      if (intrinsicAlign === "start") {
        top = rect.top + scrollYOffset + verticalAlignOffsetLeft;
      } else if (intrinsicAlign === "end") {
        top =
          rect.bottom +
          scrollYOffset -
          floatingRect.height +
          verticalAlignOffsetLeft;
      } else {
        top =
          rect.top +
          scrollYOffset +
          rect.height / 2 -
          floatingRect.height / 2 +
          verticalAlignOffsetLeft;
      }
    } else {
      top =
        rect.top +
        scrollYOffset +
        rect.height / 2 -
        floatingRect.height / 2 +
        verticalAlignOffsetLeft;
    }
    left = rect.left + scrollXOffset - floatingRect.width - horizontalGapLeft;
  }

  let posLeft = left;
  /** @type {number | undefined} */
  let posWidth = width;

  if (
    intrinsicWidth &&
    (actualDirection === "top" || actualDirection === "bottom")
  ) {
    if (intrinsicAlign === "center") {
      posLeft = rect.left + scrollXOffset + rect.width / 2;
    } else if (intrinsicAlign === "start") {
      posLeft = rect.left + scrollXOffset;
    } else {
      posLeft = rect.right + scrollXOffset;
    }
    posWidth = undefined;
  }

  /** @type {number | undefined} */
  let caretNudgePx;
  if (
    intrinsicWidth &&
    (actualDirection === "top" || actualDirection === "bottom") &&
    (intrinsicAlign === "start" || intrinsicAlign === "end")
  ) {
    // Distance from the box edge that sits on the anchor (left edge for
    // `start`, right edge for `end`) to the anchor center. This is half the
    // anchor width and does NOT depend on the floating width, so the caret
    // stays centered on the trigger when the tooltip text (and thus width)
    // changes — no recompute, no bounce. The CSS applies it from the matching
    // edge per alignment.
    caretNudgePx = rect.width / 2;
  }

  if (actualDirection === "top" || actualDirection === "bottom") {
    const finalWidth = posWidth ?? floatingRect.width;

    // `posLeft` is the box's own left edge for `start` alignment (or when
    // matching the anchor width), but for `center`/`end` it is an
    // anchor-relative coordinate that FloatingPortal shifts into place with a
    // CSS `translateX` — account for that offset to find the true rendered
    // left edge before clamping it to the viewport.
    let trueLeft = posLeft;
    if (intrinsicWidth && intrinsicAlign === "center") {
      trueLeft = posLeft - finalWidth / 2;
    } else if (intrinsicWidth && intrinsicAlign === "end") {
      trueLeft = posLeft - finalWidth;
    }

    const minLeft = scrollXOffset;
    const maxLeft = scrollXOffset + viewport.innerWidth - finalWidth;
    // Content wider than the viewport: prefer the left edge over the right.
    const clampedTrueLeft =
      maxLeft >= minLeft
        ? Math.min(Math.max(trueLeft, minLeft), maxLeft)
        : minLeft;

    const delta = clampedTrueLeft - trueLeft;
    if (delta !== 0) {
      posLeft += delta;
      // Keep the caret pointing at the (unmoved) anchor center after the
      // box itself shifted to stay within the viewport.
      if (caretNudgePx !== undefined) caretNudgePx -= delta;
    }
  } else {
    // `left`/`right`: clamp both axes. `top` is the cross axis (mirrors the
    // top/bottom case's horizontal shift; no CSS transform involved here, so
    // no extra offset accounting is needed). `left` is the primary axis -
    // the flip above already tries the preferred side, but if the content is
    // too wide for either side to fully fit, this is a final fallback so it
    // stays on-screen rather than overflowing whichever side it landed on.
    const minTop = scrollYOffset;
    const maxTop = scrollYOffset + viewport.innerHeight - floatingRect.height;
    top = maxTop >= minTop ? Math.min(Math.max(top, minTop), maxTop) : minTop;

    const minLeft = scrollXOffset;
    const maxLeft = scrollXOffset + viewport.innerWidth - floatingRect.width;
    posLeft =
      maxLeft >= minLeft
        ? Math.min(Math.max(posLeft, minLeft), maxLeft)
        : minLeft;
  }

  return {
    top,
    left: posLeft,
    ...(posWidth !== undefined && { width: posWidth }),
    actualDirection,
    caretNudgePx,
  };
}
