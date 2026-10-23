// @ts-check
// A pointer drag with a start threshold and deltas: a press, movement past
// the threshold, then moves and a release, with deltas in screen pixels or
// scaled to a world space. Built on `pointerDrag`, which owns the pointer
// capture. Shared by panning, moving nodes, and resize handles.
import { pointerDrag } from "./pointer-drag.js";

/**
 * @param {HTMLElement | SVGElement} node
 * @param {import("./track-pointer-drag.d.ts").TrackPointerDragOptions} options
 * @returns {() => void} Stops tracking.
 */
export function trackPointerDrag(node, options) {
  const {
    threshold = 3,
    buttons = [0],
    scale = () => 1,
    accept = () => true,
    onStart,
    onMove,
    onEnd,
  } = options;
  /** @type {{ x: number; y: number; lastX: number; lastY: number; started: boolean; down: PointerEvent } | null} */
  let drag = null;

  const action = pointerDrag(/** @type {HTMLElement} */ (node), {
    buttons,
    onStart(event) {
      if (!accept(event)) return false;
      drag = {
        x: event.clientX,
        y: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
        started: false,
        down: event,
      };
    },
    onMove(event) {
      if (!drag) return;
      if (!drag.started) {
        const far =
          Math.abs(event.clientX - drag.x) >= threshold ||
          Math.abs(event.clientY - drag.y) >= threshold;
        if (!far) return;
        drag.started = true;
        onStart?.(drag.down);
      }
      const k = scale() || 1;
      const dx = (event.clientX - drag.lastX) / k;
      const dy = (event.clientY - drag.lastY) / k;
      drag.lastX = event.clientX;
      drag.lastY = event.clientY;
      event.preventDefault();
      onMove?.(dx, dy, event);
    },
    onEnd(event) {
      const started = drag?.started;
      drag = null;
      if (started) onEnd?.(event);
    },
  });

  return () => {
    action.destroy();
    drag = null;
  };
}
