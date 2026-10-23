// @ts-check
// When a hover tooltip may show. A pointer must settle on a target for a
// moment, so a sweep across a chart does not flash tooltips; a key press
// shows at once; and once shown it follows without delay. Shared by the
// chart tooltip and the charts that draw their own.
import { writable } from "svelte/store";

/**
 * @param {number} [delay] Milliseconds a pointer must rest before the tooltip shows.
 * @returns {import("./tooltip-timing.d.ts").TooltipTiming}
 */
export function createTooltipTiming(delay = 150) {
  const shown = writable(false);
  let isShown = false;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;
  /** @type {"pointer" | "keyboard"} */
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
   * @param {"pointer" | "keyboard" | "sync"} [origin] Where the hover came from; defaults to the last input seen by `track`.
   */
  function settle(current, origin = lastInput) {
    present = current !== null && current !== undefined && current !== false;
    if (!present) {
      clear();
      set(false);
      return;
    }
    if (isShown || origin === "keyboard" || delay <= 0) {
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

  /**
   * Svelte action: remembers whether the last input on `node` was a pointer
   * or a key, so `settle` can tell them apart without each caller passing it.
   * @param {Element} node
   */
  function track(node) {
    const pointer = () => {
      lastInput = "pointer";
    };
    const keyboard = () => {
      lastInput = "keyboard";
    };
    node.addEventListener("pointerdown", pointer, true);
    node.addEventListener("pointermove", pointer, true);
    node.addEventListener("keydown", keyboard, true);
    return {
      destroy() {
        node.removeEventListener("pointerdown", pointer, true);
        node.removeEventListener("pointermove", pointer, true);
        node.removeEventListener("keydown", keyboard, true);
        clear();
      },
    };
  }

  return { shown, settle, track, destroy: clear };
}
