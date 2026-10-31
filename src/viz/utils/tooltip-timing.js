// @ts-check
// When a hover tooltip may show, the same on every chart:
//
// 1. A pointer rests on an item for `delay` before the tooltip shows, so a
//    sweep across a chart does not flash tooltips. A key press, a tap, or a
//    synced hover shows it at once.
// 2. Once shown, it follows to the next item without delay.
// 3. Leaving an item, or the chart, keeps it for `leaveDelay`: crossing the
//    gap to the next item swaps it without a flicker, and only a pointer
//    that stays away hides it. The chart clears its hover when it hides.
// 4. For `warm` after it hid, a new pointer hover shows it at once, so a
//    pointer wandering off and back does not wait again.
// 5. A click pins it until Escape, another click, or a press outside.
//
// Shared by the chart tooltip and the charts that draw their own.
import { writable } from "svelte/store";

/**
 * @param {number} [delay] Milliseconds a pointer must rest before the tooltip shows.
 * @param {import("./tooltip-timing.d.ts").TooltipTimingOptions} [options]
 * @returns {import("./tooltip-timing.d.ts").TooltipTiming}
 */
export function createTooltipTiming(delay = 150, options = {}) {
  const shown = writable(false);
  const pinned = writable(false);
  let showDelay = delay;
  let leaveDelay = options.leaveDelay ?? 100;
  let warm = options.warm ?? 300;
  let isShown = false;
  let isPinned = false;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let showTimer;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let leaveTimer;
  /** @type {"pointer" | "keyboard" | "touch"} */
  let lastInput = "pointer";
  let present = false;
  let hiddenAt = Number.NEGATIVE_INFINITY;

  const now = () =>
    typeof performance === "undefined" ? Date.now() : performance.now();

  /** @param {boolean} next */
  function set(next) {
    if (next === isShown) return;
    isShown = next;
    if (!next) hiddenAt = now();
    shown.set(next);
  }

  function clearShow() {
    clearTimeout(showTimer);
    showTimer = undefined;
  }

  function clearLeave() {
    clearTimeout(leaveTimer);
    leaveTimer = undefined;
  }

  /**
   * @param {unknown} current The hovered item, or a nullish value when none.
   * @param {"pointer" | "keyboard" | "touch" | "sync"} [origin] Where the hover came from; defaults to the last input seen by `track`.
   */
  function settle(current, origin = lastInput) {
    present = current !== null && current !== undefined && current !== false;
    // A pinned tooltip holds its item until it is released.
    if (isPinned) return;
    if (!present) {
      // Nothing to show: hide now. A pointer that merely left goes
      // through `leave`, which waits first.
      clearShow();
      clearLeave();
      set(false);
      return;
    }
    // An item under the pointer again: the pending hide is off.
    clearLeave();
    // Only a mouse has to settle, and not one that just left another item.
    if (
      isShown ||
      origin !== "pointer" ||
      showDelay <= 0 ||
      now() - hiddenAt < warm
    ) {
      clearShow();
      set(true);
      return;
    }
    if (showTimer === undefined) {
      showTimer = setTimeout(() => {
        showTimer = undefined;
        set(present);
      }, showDelay);
    }
  }

  /**
   * The pointer left the item or the chart. A shown tooltip stays for
   * `leaveDelay`, in case the pointer is on its way to the next item; then
   * it hides and `onHide` lets the chart clear its hover. A tooltip not yet
   * shown is cancelled at once.
   */
  function leave() {
    if (isPinned) return;
    if (!isShown) {
      clearShow();
      present = false;
      options.onHide?.();
      return;
    }
    if (leaveTimer !== undefined) return;
    leaveTimer = setTimeout(() => {
      leaveTimer = undefined;
      present = false;
      set(false);
      options.onHide?.();
    }, leaveDelay);
  }

  /**
   * The pointer is over an item again: a pending hide is off, then `fn`
   * runs, the chart's own enter. Nothing runs while pinned, so a hover
   * never moves a held tooltip. Charts that find the item under a moving
   * pointer call it with no `fn` on every move.
   * @param {() => void} [fn]
   */
  function enter(fn) {
    if (isPinned) return;
    clearLeave();
    fn?.();
  }

  /** Hold the tooltip on its current item. Nothing happens when none is shown. */
  function pin() {
    if (!present || isPinned) return;
    isPinned = true;
    clearShow();
    clearLeave();
    set(true);
    pinned.set(true);
  }

  function unpin() {
    if (!isPinned) return;
    isPinned = false;
    pinned.set(false);
  }

  function togglePin() {
    if (isPinned) unpin();
    else pin();
  }

  /**
   * Change the timings after creation, as a tooltip component with a
   * `delay` prop does.
   * @param {{ delay?: number; leaveDelay?: number; warm?: number }} next
   */
  function configure(next) {
    if (next.delay !== undefined) showDelay = next.delay;
    if (next.leaveDelay !== undefined) leaveDelay = next.leaveDelay;
    if (next.warm !== undefined) warm = next.warm;
  }

  /**
   * Svelte action: remembers whether the last input on `node` was a mouse, a
   * finger, or a key, so `settle` can tell them apart without each caller
   * passing it, and releases a pinned tooltip on a press outside the node.
   * @param {Element} node
   */
  function track(node) {
    /** @param {Event} event */
    const pointer = (event) => {
      const type = /** @type {PointerEvent} */ (event).pointerType;
      lastInput = type === "touch" || type === "pen" ? "touch" : "pointer";
    };
    const keyboard = () => {
      lastInput = "keyboard";
    };
    /** @param {Event} event */
    const outside = (event) => {
      if (!isPinned || node.contains(/** @type {Node} */ (event.target)))
        return;
      unpin();
      options.onUnpin?.();
    };
    node.addEventListener("pointerdown", pointer, true);
    node.addEventListener("pointermove", pointer, true);
    node.addEventListener("keydown", keyboard, true);
    node.ownerDocument.addEventListener("pointerdown", outside, true);
    return {
      destroy() {
        node.removeEventListener("pointerdown", pointer, true);
        node.removeEventListener("pointermove", pointer, true);
        node.removeEventListener("keydown", keyboard, true);
        node.ownerDocument.removeEventListener("pointerdown", outside, true);
        clearShow();
        clearLeave();
      },
    };
  }

  return {
    shown,
    pinned,
    settle,
    enter,
    leave,
    pin,
    unpin,
    togglePin,
    configure,
    track,
    destroy() {
      clearShow();
      clearLeave();
    },
  };
}
