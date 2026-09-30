// @ts-check

/**
 * @typedef {import("./pointer-drag.js").PointerDragOptions} PointerDragOptions
 */

/**
 * Svelte action: track one pointer drag that starts on `node`.
 *
 * The node captures the pointer, so every later event for it is routed back
 * to the node even after the pointer leaves the node, the page, or (in an
 * iframe) the document. No `window` listeners are involved, and the drag
 * starts synchronously, so a fast press-release is never missed. An idle
 * node only listens for `pointerdown`.
 *
 * Only the primary button starts a drag, and a second pointer is ignored
 * while one is active. `onStart` may return `false` to decline the drag.
 *
 * @param {HTMLElement} node
 * @param {PointerDragOptions} options
 * @returns {{ update: (options: PointerDragOptions) => void, destroy: () => void }}
 */
export function pointerDrag(node, options) {
  let current = options;
  /** @type {number | null} */
  let activePointerId = null;

  /** @param {PointerEvent} event */
  function handlePointerdown(event) {
    if (current.enabled === false || activePointerId !== null) return;
    // A secondary button opens the context menu, which swallows the
    // matching `pointerup`.
    if (event.button !== 0) return;
    if (current.onStart?.(event) === false) return;
    activePointerId = event.pointerId;
    node.addEventListener("pointermove", handlePointermove);
    node.addEventListener("pointerup", endDrag);
    node.addEventListener("pointercancel", endDrag);
    node.addEventListener("lostpointercapture", endDrag);
    node.setPointerCapture?.(event.pointerId);
  }

  function removeDragListeners() {
    node.removeEventListener("pointermove", handlePointermove);
    node.removeEventListener("pointerup", endDrag);
    node.removeEventListener("pointercancel", endDrag);
    node.removeEventListener("lostpointercapture", endDrag);
  }

  /** @param {PointerEvent} event */
  function handlePointermove(event) {
    if (event.pointerId !== activePointerId) return;
    current.onMove?.(event);
  }

  // `pointerup` is followed by `lostpointercapture`; the id check makes
  // whichever arrives first end the drag and the other a no-op.
  /** @param {PointerEvent} event */
  function endDrag(event) {
    if (event.pointerId !== activePointerId) return;
    activePointerId = null;
    removeDragListeners();
    current.onEnd?.(event);
  }

  node.addEventListener("pointerdown", handlePointerdown);

  return {
    update(options) {
      current = options;
    },
    destroy() {
      activePointerId = null;
      removeDragListeners();
      node.removeEventListener("pointerdown", handlePointerdown);
    },
  };
}
