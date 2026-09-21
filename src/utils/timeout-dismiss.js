// @ts-check

import { noop } from "./noop.js";

/**
 * Auto-close timer for notifications with a `timeout` prop.
 * `sync()` clears any pending timer and calls `setTimeout` when `open` and `timeout` > 0.
 * Skips `setTimeout` when `window` is undefined (SSR).
 * `pause()` / `resume()` track remaining time so hover can suspend auto-dismiss.
 *
 * @returns {{
 *   get timeoutId(): ReturnType<typeof setTimeout> | undefined,
 *   sync: (open: boolean, timeout: number, onTimeout: () => void) => void,
 *   pause: () => void,
 *   resume: () => void,
 *   clear: () => void,
 * }}
 */
export function createTimeoutDismiss() {
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timeoutId;
  /** @type {() => void} */
  let onTimeout = noop;
  let remaining = 0;
  let startedAt = 0;
  let active = false;
  let paused = false;
  let hiddenPause = false;
  let listening = false;

  function schedule(ms) {
    clearTimeout(timeoutId);
    timeoutId = undefined;
    remaining = ms;
    startedAt = Date.now();
    timeoutId = setTimeout(() => {
      timeoutId = undefined;
      active = false;
      remaining = 0;
      paused = false;
      onTimeout();
    }, ms);
  }

  function pause() {
    if (!active || paused || timeoutId === undefined) return;
    clearTimeout(timeoutId);
    timeoutId = undefined;
    remaining = Math.max(0, remaining - (Date.now() - startedAt));
    paused = true;
  }

  function resume() {
    if (!paused || !active) return;
    paused = false;
    if (typeof window === "undefined") return;
    if (remaining <= 0) {
      active = false;
      remaining = 0;
      onTimeout();
      return;
    }
    schedule(remaining);
  }

  function onVisibility() {
    if (typeof document === "undefined") return;
    if (document.hidden) {
      if (!active || paused) return;
      pause();
      hiddenPause = true;
      return;
    }
    if (hiddenPause) {
      hiddenPause = false;
      resume();
    }
  }

  return {
    get timeoutId() {
      return timeoutId;
    },
    /**
     * @param {boolean} open
     * @param {number} timeout
     * @param {() => void} callback
     */
    sync(open, timeout, callback) {
      if (!listening && typeof document !== "undefined") {
        listening = true;
        document.addEventListener("visibilitychange", onVisibility);
      }
      clearTimeout(timeoutId);
      timeoutId = undefined;
      paused = false;
      hiddenPause = false;
      onTimeout = callback;
      active = typeof window !== "undefined" && open && timeout > 0;
      if (active) {
        schedule(timeout);
      } else {
        remaining = 0;
      }
    },
    pause,
    resume,
    clear() {
      if (listening && typeof document !== "undefined") {
        listening = false;
        document.removeEventListener("visibilitychange", onVisibility);
      }
      clearTimeout(timeoutId);
      timeoutId = undefined;
      remaining = 0;
      active = false;
      paused = false;
      hiddenPause = false;
    },
  };
}
