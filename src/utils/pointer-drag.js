// @ts-check

/**
 * @typedef {import("./pointer-drag.js").PointerDragOptions} PointerDragOptions
 */

/** Distance (px) a pointer travels before `capture: "drag"` starts a drag. */
const DEFAULT_THRESHOLD = 4;

/**
 * Svelte action: track one pointer drag that starts on `node`.
 *
 * By default the node captures the pointer on press, so every later event
 * for it is routed back to the node even after the pointer leaves the node,
 * the page, or (in an iframe) the document. No `window` listeners are
 * involved, and the drag starts synchronously, so a fast press-release is
 * never missed. An idle node only listens for `pointerdown`.
 *
 * Capture retargets the `click` that follows the press, so a link or button
 * inside the node would stop working. Set `capture: "drag"` to defer the
 * capture until the pointer moves `threshold` pixels. A press that never
 * moves that far is a plain click on whatever was under the pointer. While
 * such a press is down, the browser's own drag and drop of links and images
 * is turned off, since it would cancel the pointer.
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
  let started = false;
  let startX = 0;
  let startY = 0;
  /** @type {Document | null} */
  let watching = null;
  /** @type {Document | null} */
  let guarding = null;

  /** @param {PointerEvent} event */
  function handlePointerdown(event) {
    if (current.enabled === false || activePointerId !== null) return;
    // A secondary button opens the context menu, which swallows the
    // matching `pointerup`.
    if (event.button !== 0) return;
    if (current.onStart?.(event) === false) return;
    activePointerId = event.pointerId;
    started = false;
    if (current.capture === "drag") {
      startX = event.clientX;
      startY = event.clientY;
      // Until the pointer is captured, it can leave the node before the
      // threshold, and its events then land elsewhere.
      watching = node.ownerDocument;
      watching.addEventListener("pointermove", handlePointermove);
      watching.addEventListener("pointerup", endDrag);
      watching.addEventListener("pointercancel", endDrag);
      // A press on a link or image can turn into the browser's own drag and
      // drop, which cancels the pointer.
      guarding = watching;
      guarding.addEventListener("dragstart", preventDefault, true);
    } else {
      beginDrag(event);
    }
  }

  /** @param {Event} event */
  function preventDefault(event) {
    event.preventDefault();
  }

  function removeWatchers() {
    if (!watching) return;
    watching.removeEventListener("pointermove", handlePointermove);
    watching.removeEventListener("pointerup", endDrag);
    watching.removeEventListener("pointercancel", endDrag);
    watching = null;
  }

  /** @param {PointerEvent} event */
  function beginDrag(event) {
    started = true;
    removeWatchers();
    node.addEventListener("pointermove", handlePointermove);
    node.addEventListener("pointerup", endDrag);
    node.addEventListener("pointercancel", endDrag);
    node.addEventListener("lostpointercapture", handleLostCapture);
    node.setPointerCapture?.(event.pointerId);
    current.onDragStart?.(event);
  }

  function removeDragListeners() {
    node.removeEventListener("pointermove", handlePointermove);
    node.removeEventListener("pointerup", endDrag);
    node.removeEventListener("pointercancel", endDrag);
    node.removeEventListener("lostpointercapture", handleLostCapture);
    removeWatchers();
    guarding?.removeEventListener("dragstart", preventDefault, true);
    guarding = null;
  }

  /** @param {PointerEvent} event */
  function handlePointermove(event) {
    if (event.pointerId !== activePointerId) return;
    if (!started) {
      const threshold = current.threshold ?? DEFAULT_THRESHOLD;
      if (
        Math.hypot(event.clientX - startX, event.clientY - startY) < threshold
      )
        return;
      beginDrag(event);
    }
    current.onMove?.(event);
  }

  // The click after a drag is retargeted to the capturing node, so it would
  // activate nothing useful, or the wrong thing.
  function swallowNextClick() {
    const doc = node.ownerDocument;
    /** @param {Event} event */
    function swallow(event) {
      event.stopImmediatePropagation();
      event.preventDefault();
      release();
    }
    function release() {
      clearTimeout(timer);
      doc.removeEventListener("click", swallow, true);
    }
    // No click follows when the pointer is released over nothing.
    const timer = setTimeout(release, 0);
    doc.addEventListener("click", swallow, true);
  }

  // A touch pointer is captured by the element it pressed. Capturing on
  // `node` releases that capture, and the descendant's `lostpointercapture`
  // bubbles up here, which is not the node losing the pointer.
  /** @param {PointerEvent} event */
  function handleLostCapture(event) {
    if (event.target === node) endDrag(event);
  }

  // `pointerup` is followed by `lostpointercapture`; the id check makes
  // whichever arrives first end the drag and the other a no-op.
  /** @param {PointerEvent} event */
  function endDrag(event) {
    if (event.pointerId !== activePointerId) return;
    const dragged = started;
    activePointerId = null;
    started = false;
    removeDragListeners();
    if (dragged && current.capture === "drag" && event.type === "pointerup")
      swallowNextClick();
    current.onEnd?.(event, dragged);
  }

  node.addEventListener("pointerdown", handlePointerdown);

  return {
    update(options) {
      current = options;
    },
    destroy() {
      activePointerId = null;
      started = false;
      removeDragListeners();
      node.removeEventListener("pointerdown", handlePointerdown);
    },
  };
}
