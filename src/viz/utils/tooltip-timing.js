// @ts-check
// When a hover tooltip may show. A pointer must settle on a target for a
// moment, so a sweep across a chart does not flash tooltips; a key press or
// a tap shows at once; once shown it follows without delay; and a click
// pins it until Escape, another click, or a press outside the chart. Shared
// by the chart tooltip and the charts that draw their own.
import { writable } from "svelte/store";

/**
 * @param {number} [delay] Milliseconds a pointer must rest before the tooltip shows.
 * @param {{ onUnpin?: () => void }} [options] `onUnpin` runs when a press outside the tracked node releases a pinned tooltip, so the chart can clear its hover.
 * @returns {import("./tooltip-timing.d.ts").TooltipTiming}
 */
export function createTooltipTiming(delay = 150, options = {}) {
  const shown = writable(false);
  const pinned = writable(false);
  let isShown = false;
  let isPinned = false;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;
  /** @type {"pointer" | "keyboard" | "touch"} */
  let lastInput = "pointer";
  let present = false;

  /** @param {boolean} next */
  function set(next) {
    if (next === isShown) return;
    isShown = next;
    shown.set(next);
  }

  function clear() {
    clearTimeout(timer);
    timer = undefined;
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
      clear();
      set(false);
      return;
    }
    // Only a mouse has to settle: a key or a finger means it.
    if (isShown || origin !== "pointer" || delay <= 0) {
      set(true);
      return;
    }
    if (timer === undefined) {
      timer = setTimeout(() => {
        timer = undefined;
        set(present);
      }, delay);
    }
  }

  /** Hold the tooltip on its current item. Nothing happens when none is shown. */
  function pin() {
    if (!present || isPinned) return;
    isPinned = true;
    clear();
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
        clear();
      },
    };
  }

  return {
    shown,
    pinned,
    settle,
    pin,
    unpin,
    togglePin,
    track,
    destroy: clear,
  };
}
