// @ts-check

/**
 * @typedef {import("./gesture.js").GestureOptions} GestureOptions
 */

import {
  createArena,
  createExternalPinch,
  normalizeOptions,
} from "./gesture-arena.js";
import { computeTouchAction, wheelFactor } from "./gesture-math.js";
import { isPointerClaimed } from "./pointer-claim.js";

/** A wheel pinch ends when the wheel has been quiet this long. */
const WHEEL_IDLE_MS = 150;
/** The click after a claimed press arrives within the same input event. */
const CLICK_SWALLOW_MS = 50;

/**
 * Svelte action: recognize tap, double tap, long press, pan, pinch and
 * swipe on `node` from Pointer Events.
 *
 * One press is one arena: the recognizers race, the first to claim the
 * press makes the incompatible ones fail, and the rest see nothing of it.
 * `touch-action` is set from the gestures you ask for, so a horizontal
 * swipe leaves the page's vertical scroll alone. An idle node listens for
 * `pointerdown` only; the move, up, cancel and Escape listeners exist for
 * the length of a press. The one non-passive listener is `touchmove`, only
 * while a long press may hand off to a pan, so a held finger drags instead
 * of scrolling.
 *
 * A gesture is never the only way in: WCAG 2.5.1 asks for a single-pointer
 * alternative to a multi-point or path-based gesture, and 2.5.7 for one to
 * dragging. Give every handler a button or a key.
 *
 * Nothing here touches `window` or `document` until the action runs, so
 * importing it is safe on the server.
 *
 * @param {HTMLElement} node
 * @param {GestureOptions} [options]
 * @returns {{
 *   update: (options?: GestureOptions) => void,
 *   destroy: () => void,
 *   cancel: () => void,
 * }}
 */
export function createGestures(node, options = {}) {
  let config = normalizeOptions(options);

  /** Pointers this node captured itself, so their capture is not a rival's. */
  const ownCapture = new Set();
  /** @type {EventTarget | null} */
  let pressTarget = null;
  let scrollLocked = false;
  /** @type {Array<[EventTarget, string, EventListener, (boolean | AddEventListenerOptions)?]>} */
  let sessionListeners = [];

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let clickTimer;
  /** @type {EventListener | null} */
  let clickSwallower = null;

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let wheelTimer;

  let styled = false;
  let previousTouchAction = "";
  let previousCallout = "";
  let optionalListeners = false;

  const host = {
    setTimer: (/** @type {() => void} */ callback, /** @type {number} */ ms) =>
      setTimeout(callback, ms),
    clearTimer: (/** @type {unknown} */ id) =>
      clearTimeout(/** @type {ReturnType<typeof setTimeout>} */ (id)),
    capture(/** @type {number} */ pointerId) {
      ownCapture.add(pointerId);
      try {
        node.setPointerCapture?.(pointerId);
      } catch {
        // The pointer is gone, or never was a real one.
      }
    },
    lockScroll(/** @type {boolean} */ locked) {
      scrollLocked = locked;
    },
    suppressClick() {
      stopSwallowingClick();
      // Capturing the pointer retargets the click that follows a drag or a
      // hold, and a click after either is not a tap.
      const swallow = /** @type {EventListener} */ (
        (event) => {
          event.stopPropagation();
          event.preventDefault();
          stopSwallowingClick();
        }
      );
      clickSwallower = swallow;
      node.addEventListener("click", swallow, true);
      clickTimer = setTimeout(stopSwallowingClick, CLICK_SWALLOW_MS);
    },
  };

  const arena = createArena(() => config, host);
  const external = createExternalPinch(() => config);

  function stopSwallowingClick() {
    clearTimeout(clickTimer);
    if (clickSwallower) node.removeEventListener("click", clickSwallower, true);
    clickSwallower = null;
  }

  /**
   * @param {PointerEvent} event
   * @returns {import("./gesture-arena.js").PointerInput}
   */
  function toInput(event) {
    return {
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      clientX: event.clientX,
      clientY: event.clientY,
      time: event.timeStamp,
      button: event.button,
      event,
    };
  }

  /** @param {EventTarget | null} target */
  function isIgnored(target) {
    if (!config.ignore || !(target instanceof Element)) return false;
    const match = target.closest(config.ignore);
    return match !== null && match !== node && node.contains(match);
  }

  /**
   * @param {EventTarget} target
   * @param {string} type
   * @param {EventListener} listener
   * @param {boolean | AddEventListenerOptions} [options]
   */
  function listen(target, type, listener, options) {
    target.addEventListener(type, listener, options);
    sessionListeners.push([target, type, listener, options]);
  }

  /** @param {Event} event */
  function prevent(event) {
    event.preventDefault();
  }

  /** @param {Event} event */
  function blockTouchScroll(event) {
    if (scrollLocked && event.cancelable) event.preventDefault();
  }

  /** @param {PointerEvent} event */
  function beginSession(event) {
    const doc = node.ownerDocument;
    pressTarget = event.target;
    stopSwallowingClick();
    listen(
      doc,
      "pointermove",
      /** @type {EventListener} */ (handlePointermove),
    );
    listen(doc, "pointerup", /** @type {EventListener} */ (handlePointerup));
    listen(
      doc,
      "pointercancel",
      /** @type {EventListener} */ (handlePointercancel),
    );
    listen(doc, "keydown", /** @type {EventListener} */ (handleKeydown), true);
    listen(
      node,
      "gotpointercapture",
      /** @type {EventListener} */ (handleGotPointerCapture),
    );
    listen(
      node,
      "lostpointercapture",
      /** @type {EventListener} */ (handleLostPointerCapture),
    );
    if (event.pointerType !== "mouse" && config.longPress) {
      // A held finger opens the context menu, starts a text selection or
      // drags the image under it. Only for the length of the press, and by
      // event, so no style is restyled across the subtree.
      listen(node, "contextmenu", prevent);
      listen(node, "selectstart", prevent);
      listen(node, "dragstart", prevent);
      if (config.pan) {
        listen(node, "touchmove", blockTouchScroll, { passive: false });
      }
    }
  }

  function endSession() {
    for (const [target, type, listener, options] of sessionListeners) {
      target.removeEventListener(type, listener, options);
    }
    sessionListeners = [];
    ownCapture.clear();
    pressTarget = null;
    scrollLocked = false;
  }

  function settle() {
    if (!arena.active) endSession();
  }

  /** @param {PointerEvent} event */
  function handlePointerdown(event) {
    if (!config.enabled) return;
    // A release that never arrived (the pointer left the window before it
    // was captured) leaves a press behind, and the next press replaces it.
    if (arena.active && arena.has(event.pointerId)) {
      arena.cancel("cancel");
      settle();
    }
    if (arena.active) {
      arena.down(toInput(event));
      return;
    }
    // A child that handled the press says so; a second finger on a control
    // that was ignored does not start a gesture.
    if (event.defaultPrevented || event.isPrimary === false) return;
    if (isPointerClaimed(event)) return;
    if (isIgnored(event.target)) return;
    if (!arena.down(toInput(event))) return;
    beginSession(event);
  }

  /** @param {PointerEvent} event */
  function handlePointermove(event) {
    if (!arena.active) return;
    // A mouse that moves with no button down was released out of reach.
    if (event.pointerType === "mouse" && event.buttons === 0) {
      arena.cancel("cancel");
      settle();
      return;
    }
    arena.move(toInput(event));
  }

  /** @param {PointerEvent} event */
  function handlePointerup(event) {
    arena.up(toInput(event));
    settle();
  }

  /** @param {PointerEvent} event */
  function handlePointercancel(event) {
    if (!arena.has(event.pointerId)) return;
    arena.cancel("cancel");
    settle();
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (event.key !== "Escape" || !arena.claimed) return;
    event.stopPropagation();
    arena.cancel("escape");
    settle();
  }

  // Touch pointers are captured to the element they pressed. A capture that
  // lands on a different element is a child (a slider thumb, a drag handle
  // using `pointerDrag`) taking the press: the arena gives it up.
  /** @param {PointerEvent} event */
  function handleGotPointerCapture(event) {
    if (!arena.has(event.pointerId) || ownCapture.has(event.pointerId)) return;
    if (event.target === node || event.target === pressTarget) return;
    arena.cancel("claimed");
    settle();
  }

  // Our capture ends when an element takes the pointer from this node.
  /** @param {PointerEvent} event */
  function handleLostPointerCapture(event) {
    if (event.target === node) ownCapture.delete(event.pointerId);
  }

  /** @param {WheelEvent} event */
  function handleWheel(event) {
    // A plain wheel scrolls. Ctrl+wheel is also how a trackpad pinch
    // arrives in Chromium and Firefox, and zooms the page unless stopped.
    if (!event.ctrlKey || arena.active || config.pinch?.wheel === false) return;
    if (!config.enabled) return;
    event.preventDefault();
    external.change("wheel", {
      factor: wheelFactor(event.deltaY, event.deltaMode, true),
      clientX: event.clientX,
      clientY: event.clientY,
      event,
    });
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => external.end(), WHEEL_IDLE_MS);
  }

  /** @param {Event} raw Safari's `GestureEvent`. */
  function handleGesture(raw) {
    const event =
      /** @type {Event & { scale: number, rotation: number, clientX: number, clientY: number }} */ (
        raw
      );
    if (!config.enabled || arena.active) return;
    // Safari would zoom the page.
    event.preventDefault();
    if (event.type === "gestureend") {
      external.end();
      return;
    }
    external.change("gesture", {
      scale: event.type === "gesturestart" ? 1 : event.scale,
      rotation: (event.rotation * Math.PI) / 180,
      clientX: event.clientX,
      clientY: event.clientY,
      event,
    });
  }

  function syncOptionalListeners() {
    const wanted = config.enabled && config.pinch !== null;
    if (wanted === optionalListeners) return;
    optionalListeners = wanted;
    const toggle = wanted ? "addEventListener" : "removeEventListener";
    node[toggle]("wheel", /** @type {EventListener} */ (handleWheel), {
      passive: false,
    });
    for (const type of ["gesturestart", "gesturechange", "gestureend"]) {
      node[toggle](type, handleGesture, { passive: false });
    }
    if (!wanted) {
      clearTimeout(wheelTimer);
      external.end({ cancelled: true });
    }
  }

  function applyStyles() {
    if (!styled) {
      previousTouchAction = node.style.touchAction;
      previousCallout = node.style.getPropertyValue("-webkit-touch-callout");
      styled = true;
    }
    const touchAction =
      config.touchAction === false || !config.enabled
        ? previousTouchAction
        : (config.touchAction ??
          computeTouchAction({
            doubleTap: config.doubleTap !== null,
            pinch: config.pinch !== null,
            // A pan that waits for a long press leaves the scroll to the page.
            pan:
              config.pan && config.pan.touch !== "afterLongPress"
                ? config.pan.axis
                : null,
            swipe: config.swipe?.axis ?? null,
          }));
    // Writing the same value again still invalidates style.
    if (node.style.touchAction !== touchAction) {
      node.style.touchAction = touchAction;
    }
    // iOS shows a callout on a held link or image.
    const callout =
      config.longPress && config.enabled ? "none" : previousCallout;
    if (node.style.getPropertyValue("-webkit-touch-callout") !== callout) {
      node.style.setProperty("-webkit-touch-callout", callout);
    }
  }

  function restoreStyles() {
    if (!styled) return;
    node.style.touchAction = previousTouchAction;
    node.style.setProperty("-webkit-touch-callout", previousCallout);
    styled = false;
  }

  node.addEventListener(
    "pointerdown",
    /** @type {EventListener} */ (handlePointerdown),
  );
  applyStyles();
  syncOptionalListeners();

  return {
    update(next = {}) {
      config = normalizeOptions(next);
      if (!config.enabled && arena.active) {
        arena.cancel("disabled");
        settle();
      }
      applyStyles();
      syncOptionalListeners();
    },
    /** End the press in progress as cancelled, such as when a drag engine takes over. */
    cancel() {
      arena.cancel("claimed");
      settle();
    },
    destroy() {
      arena.destroy();
      settle();
      endSession();
      external.end({ cancelled: true });
      config = normalizeOptions({ enabled: false });
      syncOptionalListeners();
      stopSwallowingClick();
      clearTimeout(wheelTimer);
      node.removeEventListener(
        "pointerdown",
        /** @type {EventListener} */ (handlePointerdown),
      );
      restoreStyles();
    },
  };
}

/** The action form of `createGestures`. */
export const gesture = createGestures;
