// @ts-check
import { tick } from "svelte";

/**
 * Build an `announceStatus(text)` function for a visually-hidden live
 * region. The text is reset first so announcing the same message
 * twice still mutates the DOM — live regions only fire on an actual
 * text change.
 *
 * @param {(text: string) => void} setStatusText
 * @returns {(text: string) => Promise<void>}
 */
export function createStatusAnnouncer(setStatusText) {
  return async function announceStatus(text) {
    setStatusText("");
    await tick();
    setStatusText(text);
  };
}

/**
 * Build a `close(trigger)` function that dismisses a menu and
 * notifies consumers of the cause. Guarded on `getOpen()` so a
 * dismissal gesture fired while already closed does not emit a
 * phantom event, and so redundant `open = false` assignments do not
 * double-fire.
 *
 * @param {Object} options
 * @param {() => boolean} options.getOpen
 * @param {(open: boolean) => void} options.setOpen
 * @param {(event: "close", detail: { trigger: string }) => void} options.dispatch
 * @returns {(trigger: string) => void}
 */
export function createMenuCloseHandler({ getOpen, setOpen, dispatch }) {
  return function close(trigger) {
    if (getOpen()) {
      setOpen(false);
      dispatch("close", { trigger });
    }
  };
}

/**
 * The tail shared by `clear()` implementations: wait for bindings to
 * settle, then optionally reopen and/or focus.
 *
 * @param {{ open?: boolean, focus?: boolean } | undefined} options
 * @param {(open: boolean) => void} setOpen
 * @param {() => (HTMLElement | null | undefined)} getFocusTarget
 * @returns {Promise<void>}
 */
export async function applyPostClearOptions(options, setOpen, getFocusTarget) {
  await tick();
  if (options?.open === true) setOpen(true);
  if (options?.focus !== false) getFocusTarget()?.focus();
}
