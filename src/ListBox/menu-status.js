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
 * Build the `open` event bookkeeping for a listbox menu, the counterpart of
 * `createMenuCloseHandler`. `openMenu(trigger)` opens a closed menu and
 * records why. `sync()`, called from `afterUpdate`, dispatches `open` once
 * per closed-to-open transition that reached the DOM, so an open undone in
 * the same handler reports nothing. A transition with no recorded trigger
 * came from the consumer setting `open`, and reports `"programmatic"`.
 * Mounting already open is not a transition.
 *
 * @param {Object} options
 * @param {() => boolean} options.getOpen
 * @param {(open: boolean) => void} options.setOpen
 * @param {(event: "open", detail: { trigger: string }) => void} options.dispatch
 * @returns {{ openMenu: (trigger: string) => void; sync: () => void }}
 */
export function createMenuOpenHandler({ getOpen, setOpen, dispatch }) {
  let prevOpen = getOpen();
  /** @type {string | null} */
  let pendingTrigger = null;

  return {
    openMenu(trigger) {
      if (getOpen()) return;
      pendingTrigger = trigger;
      setOpen(true);
    },
    sync() {
      const open = getOpen();
      const trigger = pendingTrigger ?? "programmatic";
      const opened = open && !prevOpen;
      prevOpen = open;
      pendingTrigger = null;
      if (opened) dispatch("open", { trigger });
    },
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
