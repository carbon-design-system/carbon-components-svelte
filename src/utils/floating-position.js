// @ts-check
import { computePosition, formatPlacement } from "./compute-position.js";

/**
 * @typedef {{ top: number, bottom: number, left: number, right: number, width: number, height: number }} RectLike
 */

/**
 * Place a floating element next to an anchor. Caller passes both rects and the
 * viewport. Flips direction when the preferred side does not fit. The
 * side-and-gaps form of `computePosition`, which does the math.
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
 * @param {boolean | "any"} [options.flipAlign=false] - Take another alignment along the anchor edge when the box runs past the viewport. `"any"` also tries center. Places by the box's real width: `left` is its left edge, with no `translateX`.
 * @param {boolean} [options.flipAxis=false] - When neither side along `direction` has room, open across the anchor, below it or above it for a side placement and beside it for a vertical one.
 * @param {number} [options.padding=0] - Room kept inside the viewport along the anchor's edge, when fitting the alignment or reporting a slide.
 * @param {number | false} [options.shift=false] - Report how far the box would have to slide to sit this far inside the viewport. The box is not moved.
 * @returns {{ top: number, left: number, width?: number, actualDirection: "bottom" | "top" | "left" | "right", actualAlign: "start" | "center" | "end", shiftX: number, exact: boolean, caretNudgePx?: number }}
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
  flipAlign = false,
  flipAxis = false,
  padding = 0,
  shift = false,
}) {
  const scrollYOffset = useFixedPosition ? 0 : viewport.scrollY;
  const scrollXOffset = useFixedPosition ? 0 : viewport.scrollX;
  const preferred = lockedDirection ?? direction;
  const verticalPreferred = preferred === "top" || preferred === "bottom";
  // Fitting the alignment or the slide needs the box's real width.
  const exact = Boolean(flipAlign) || flipAxis || shift !== false;

  const result = computePosition(
    rect,
    {
      width: verticalPreferred && !exact ? 0 : floatingRect.width,
      height: floatingRect.height,
    },
    {
      // Above and below, a box that matches the anchor's width starts at the
      // anchor's edge. Beside it, only an intrinsic box takes an alignment.
      placement: formatPlacement(
        preferred,
        verticalPreferred
          ? intrinsicWidth
            ? intrinsicAlign
            : "start"
          : intrinsicWidth
            ? intrinsicAlign
            : "center",
      ),
      // A locked side stays, and its alignment still fits.
      flip: {
        side: !lockedDirection,
        align: flipAlign,
        fallbackAxis: flipAxis,
      },
      padding: { cross: padding },
      shift: exact && shift !== false ? { padding: shift } : false,
      boundary: {
        left: 0,
        top: 0,
        right: viewport.innerWidth,
        bottom: viewport.innerHeight,
      },
      offset: ({ side }) => ({
        main: {
          top: gapTop,
          bottom: gapBottom,
          left: horizontalGapLeft,
          right: horizontalGapRight,
        }[side],
        cross:
          side === "left"
            ? verticalAlignOffsetLeft
            : side === "right"
              ? verticalAlignOffsetRight
              : 0,
      }),
    },
  );

  const actualDirection = result.side;
  const vertical = actualDirection === "top" || actualDirection === "bottom";
  // The box stays on the anchor, and so does the portal. The slide is only
  // reported, for the caller to apply to the content.
  const top = result.y - result.shift.y + scrollYOffset;
  // Above and below, an intrinsic box is placed by the point of the anchor
  // its alignment names and CSS slides it back by its own width, so a width
  // that changes never moves it.
  const left =
    (vertical ? result.reference.x : result.x - result.shift.x) + scrollXOffset;

  /** @type {number | undefined} */
  let caretNudgePx;
  if (
    intrinsicWidth &&
    vertical &&
    (result.align === "start" || result.align === "end")
  ) {
    // Distance from the box edge that sits on the anchor (left edge for
    // `start`, right edge for `end`) to the anchor center. This is half the
    // anchor width and does NOT depend on the floating width, so the caret
    // stays centered on the trigger when the tooltip text (and thus width)
    // changes: no recompute, no bounce. The CSS applies it from the matching
    // edge per alignment.
    caretNudgePx = rect.width / 2;
  }

  return {
    top,
    left,
    ...(vertical && !intrinsicWidth && { width: rect.width }),
    actualDirection,
    actualAlign: result.align,
    shiftX: result.shift.x,
    exact,
    caretNudgePx,
  };
}
