// @ts-check

import { edgeScrollSpeed } from "./dnd-math.js";

/** How far outside a scroll box the pointer still presses against it. */
export const EDGE_SLACK = 24;

/**
 * The viewport as a box. Reads `innerWidth` from the window of `doc`.
 * @param {Document} doc
 */
function viewportBox(doc) {
  const win = doc.defaultView;
  return {
    left: 0,
    top: 0,
    right: win?.innerWidth ?? 0,
    bottom: win?.innerHeight ?? 0,
  };
}

/**
 * Edge auto-scroll for a drag. Create one per session; call `step` on every
 * animation frame while the pointer is down.
 *
 * It scrolls whichever box the pointer presses against, the innermost first,
 * then the page, on both axes. The speed rises toward the edge and ramps up
 * over 400 ms, so a brush of the edge on the way to a drop does not fling the
 * list. Fractions of a pixel carry over to the next frame.
 */
export function createAutoScroll() {
  let edgeSince = 0;
  const carry = { x: 0, y: 0 };

  return {
    /**
     * @param {object} options
     * @param {Document} options.doc
     * @param {number} options.x - Pointer, in viewport pixels.
     * @param {number} options.y
     * @param {number} options.dt - ms since the last frame.
     * @param {number} options.now - Frame time.
     * @param {HTMLElement[]} options.scrollers - Nearest first.
     * @param {boolean} options.rtl - Scroll boxes count from 0 down in RTL.
     * @returns {boolean} Whether another frame is needed.
     */
    step({ doc, x, y, dt, now, scrollers, rtl }) {
      const page = doc.scrollingElement;
      const boxes = page ? [...scrollers, page] : scrollers;
      const held = edgeSince ? now - edgeSince : 0;
      let pressing = false;
      let moved = false;

      for (const axis of /** @type {const} */ (["y", "x"])) {
        for (const el of boxes) {
          const rect =
            el === page ? viewportBox(doc) : el.getBoundingClientRect();
          const along = axis === "y" ? y : x;
          const across = axis === "y" ? x : y;
          const crossStart = axis === "y" ? rect.left : rect.top;
          const crossEnd = axis === "y" ? rect.right : rect.bottom;
          if (
            across < crossStart - EDGE_SLACK ||
            across > crossEnd + EDGE_SLACK
          )
            continue;
          const speed = edgeScrollSpeed({
            pointer: along,
            start: axis === "y" ? rect.top : rect.left,
            end: axis === "y" ? rect.bottom : rect.right,
            held,
          });
          if (speed === 0) continue;
          const room =
            axis === "y"
              ? el.scrollHeight - el.clientHeight
              : el.scrollWidth - el.clientWidth;
          const position = axis === "y" ? el.scrollTop : el.scrollLeft;
          // A right-to-left scroller counts from 0 down to -room.
          const rtlX = axis === "x" && rtl;
          const min = rtlX ? -room : 0;
          const max = rtlX ? 0 : room;
          if (
            (speed < 0 && position <= min + 0.5) ||
            (speed > 0 && position >= max - 0.5)
          )
            continue;
          pressing = true;
          carry[axis] += (speed * dt) / 1000;
          const whole = Math.trunc(carry[axis]);
          carry[axis] -= whole;
          if (whole !== 0) {
            if (axis === "y") el.scrollTop = position + whole;
            else el.scrollLeft = position + whole;
            moved = true;
          }
          break;
        }
      }
      edgeSince = pressing ? edgeSince || now : 0;
      return pressing || moved;
    },
  };
}
