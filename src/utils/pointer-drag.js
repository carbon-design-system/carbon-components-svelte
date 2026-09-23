// @ts-check
// Track a pointer drag on an element: a press, movement past a threshold,
// then moves and a release, with deltas in screen pixels or scaled to a
// world space. Shared by panning, moving nodes, and resize handles.

/**
 * @param {HTMLElement | SVGElement} node
 * @param {import("./pointer-drag.d.ts").PointerDragOptions} options
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
  /** @type {{ id: number; x: number; y: number; lastX: number; lastY: number; started: boolean; down: PointerEvent } | null} */
  let drag = null;

  /** @param {PointerEvent} event */
  function down(event) {
    if (drag || !buttons.includes(event.button) || !accept(event)) return;
    drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      started: false,
      down: event,
    };
    if (typeof node.setPointerCapture === "function") {
      try {
        node.setPointerCapture(event.pointerId);
      } catch {
        // A synthetic event has no pointer to capture.
      }
    }
    node.addEventListener("pointermove", move);
    node.addEventListener("pointerup", up);
    node.addEventListener("pointercancel", up);
  }

  /** @param {PointerEvent} event */
  function move(event) {
    if (!drag || event.pointerId !== drag.id) return;
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
  }

  /** @param {PointerEvent} event */
  function up(event) {
    if (!drag || event.pointerId !== drag.id) return;
    const started = drag.started;
    drag = null;
    node.removeEventListener("pointermove", move);
    node.removeEventListener("pointerup", up);
    node.removeEventListener("pointercancel", up);
    if (started) onEnd?.(event);
  }

  node.addEventListener("pointerdown", down);
  return () => {
    node.removeEventListener("pointerdown", down);
    node.removeEventListener("pointermove", move);
    node.removeEventListener("pointerup", up);
    node.removeEventListener("pointercancel", up);
    drag = null;
  };
}
