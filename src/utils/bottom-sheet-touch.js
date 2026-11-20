// @ts-check
import { claimTouch } from "./bottom-sheet.js";

/**
 * @typedef {object} SheetTouchOptions
 * @property {boolean} [enabled] - Set to `false` to ignore touches.
 * @property {() => boolean} atMax - Whether the sheet is at its tallest snap point.
 * @property {() => void} onStart - The sheet claimed the gesture.
 * @property {(travel: number, time: number) => void} onMove - Finger travel in px since the claim; positive is down.
 * @property {(time?: number) => void} onEnd - The finger lifted, or the touch was cancelled, at `time` (an event's `timeStamp`).
 */

/**
 * Svelte action: share a scrolling element's touches between the element
 * and the sheet around it.
 *
 * A browser decides at the first move whether a touch scrolls, and a
 * `touch-action` cannot depend on direction, so the element keeps
 * `touch-action: pan-y` and this action cancels the first `touchmove`
 * whenever the sheet should take the gesture (see `claimTouch`). That
 * listener is non-passive and exists only while a finger is down. Once the
 * browser has begun scrolling the element, a `touchmove` can no longer be
 * cancelled, so a scroll that reaches the top and keeps going down hands
 * the rest of the gesture to the sheet instead: `overscroll-behavior:
 * contain` on the element keeps the browser from doing anything with that
 * overscroll, so there is nothing to cancel.
 *
 * @param {HTMLElement} node
 * @param {SheetTouchOptions} options
 * @returns {{ update: (options: SheetTouchOptions) => void, destroy: () => void }}
 */
export function sheetTouch(node, options) {
  let current = options;
  /** @type {"idle" | "undecided" | "sheet" | "content"} */
  let mode = "idle";
  let sideways = false;
  let startX = 0;
  let startY = 0;
  let startScrollTop = 0;
  let claimY = 0;
  let lastY = 0;

  /** @param {TouchEvent} event */
  function handleTouchstart(event) {
    if (current.enabled === false) return;
    if (mode !== "idle" || event.touches.length !== 1) return;
    const touch = event.touches[0];
    startX = touch.clientX;
    startY = lastY = touch.clientY;
    startScrollTop = node.scrollTop;
    sideways = false;
    mode = "undecided";
    node.addEventListener("touchmove", handleTouchmove, { passive: false });
    node.addEventListener("touchend", handleTouchend);
    node.addEventListener("touchcancel", handleTouchend);
  }

  /** @param {number} y */
  function claim(y) {
    mode = "sheet";
    claimY = y;
    current.onStart();
  }

  /** @param {TouchEvent} event */
  function handleTouchmove(event) {
    // A second finger is a pinch or a two-finger scroll: not the sheet's.
    if (event.touches.length !== 1) {
      handleTouchend();
      return;
    }
    const touch = event.touches[0];
    if (mode === "undecided") {
      const claimed = claimTouch({
        dx: touch.clientX - startX,
        dy: touch.clientY - startY,
        scrollTop: startScrollTop,
        atMax: current.atMax(),
      });
      if (claimed === "sheet") claim(touch.clientY);
      else if (claimed === "content") {
        mode = "content";
        sideways =
          Math.abs(touch.clientX - startX) > Math.abs(touch.clientY - startY);
      }
    } else if (
      mode === "content" &&
      !sideways &&
      node.scrollTop <= 0 &&
      touch.clientY > lastY &&
      current.atMax()
    ) {
      // The content scrolled to the top and the finger is still going
      // down: the rest of the gesture is the sheet's.
      claim(lastY);
    }
    lastY = touch.clientY;
    if (mode === "sheet") {
      if (event.cancelable) event.preventDefault();
      current.onMove(touch.clientY - claimY, event.timeStamp);
    }
  }

  /** @param {Event} [event] */
  function handleTouchend(event) {
    node.removeEventListener("touchmove", handleTouchmove);
    node.removeEventListener("touchend", handleTouchend);
    node.removeEventListener("touchcancel", handleTouchend);
    const wasSheet = mode === "sheet";
    mode = "idle";
    if (wasSheet) current.onEnd(event?.timeStamp);
  }

  node.addEventListener("touchstart", handleTouchstart, { passive: true });

  return {
    update(options) {
      current = options;
      if (current.enabled === false && mode !== "idle") handleTouchend();
    },
    destroy() {
      handleTouchend();
      node.removeEventListener("touchstart", handleTouchstart);
    },
  };
}
