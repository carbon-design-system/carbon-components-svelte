// @ts-check
import { returnFocus } from "./focus.js";
import { createHoverFocusPause } from "./pause-on-hover-focus.js";
import { createTimeoutDismiss } from "./timeout-dismiss.js";

/**
 * Shared open/close + auto-dismiss-timeout + pause-on-hover wiring for
 * `InlineNotification` and `ToastNotification`: closing dispatches a
 * cancelable "close" event (detail `{ timeout }`) and only applies `setOpen(false)`
 * when no listener calls `preventDefault()`; an auto-dismiss timeout closes
 * the same way, with `timeout: true`. Closing while focus is inside returns
 * it to the element focused before focus entered the notification.
 * @param {object} options
 * @param {(
 *   name: string,
 *   detail?: object,
 *   options?: object,
 * ) => boolean} options.dispatch
 * @param {() => boolean} options.getPauseOnHover
 * @param {(open: boolean) => void} options.setOpen
 * @returns {{
 *   close: (closeFromTimeout?: unknown) => void,
 *   sync: (open: boolean, timeout: number) => void,
 *   handleMouseenter: () => void,
 *   handleMouseleave: (event: MouseEvent) => void,
 *   handleFocusIn: (event: FocusEvent) => void,
 *   handleFocusOut: (event: FocusEvent) => void,
 *   dispose: () => void,
 * }}
 */
export function createDismissibleNotification({
  dispatch,
  getPauseOnHover,
  setOpen,
}) {
  const dismiss = createTimeoutDismiss();

  const {
    handleMouseenter,
    handleMouseleave,
    handleFocusIn,
    handleFocusOut,
    refresh,
    reset,
  } = createHoverFocusPause(dismiss, getPauseOnHover);

  /** @type {HTMLElement | null} */
  let prevFocus = null;
  /** @type {Element | null} */
  let root = null;
  let wasOpen = false;
  let focusInside = false;

  /**
   * Remember where focus came from when it enters from outside, so closing
   * (which unmounts the focused close or action button) can send it back.
   * @param {FocusEvent} event
   */
  function trackFocusIn(event) {
    handleFocusIn();
    focusInside = true;
    const current = event.currentTarget;
    if (!(current instanceof Element)) return;
    root = current;
    const from = event.relatedTarget;
    if (!(from instanceof Node && current.contains(from))) {
      prevFocus = from instanceof HTMLElement ? from : null;
    }
  }

  /**
   * @param {FocusEvent} event
   */
  function trackFocusOut(event) {
    handleFocusOut(event);
    const next = event.relatedTarget;
    if (next instanceof Node && root?.contains(next)) return;
    // Chrome also fires `focusout` while removing the focused node, before
    // `dispose()` runs, so only settle the flag once the unmount is done.
    queueMicrotask(() => {
      focusInside = !!root?.contains(document.activeElement);
    });
  }

  function restoreFocus() {
    returnFocus(prevFocus, root);
    prevFocus = null;
  }

  /**
   * Close the notification. `closeFromTimeout` is passed through verbatim
   * as the click handler for the close button (so it commonly receives a
   * `MouseEvent`, which is intentionally not `=== true`).
   * @param {unknown} [closeFromTimeout]
   */
  function close(closeFromTimeout) {
    dismiss.clear();

    const shouldContinue = dispatch(
      "close",
      { timeout: closeFromTimeout === true },
      { cancelable: true },
    );
    if (shouldContinue) {
      setOpen(false);
      restoreFocus();
    }
  }

  /**
   * @param {boolean} open
   * @param {number} timeout
   */
  function sync(open, timeout) {
    // Also covers a consumer setting `open` to false (e.g. from an action
    // button), which skips `close()`.
    if (wasOpen && !open) {
      restoreFocus();
      reset();
    }
    wasOpen = open;
    dismiss.sync(open, timeout, () => close(true));
    // `dismiss.sync()` restarts the timer unpaused; keep it paused while
    // the pointer or focus is still inside (e.g. a queue `update()`).
    if (open) refresh();
  }

  return {
    close,
    sync,
    handleMouseenter,
    handleMouseleave,
    handleFocusIn: trackFocusIn,
    handleFocusOut: trackFocusOut,
    // Unmounting while focused (e.g. a queue `remove()`/`clear()`) drops
    // focus to `<body>`; by now the root may already be detached, so rely on
    // the tracked flag rather than `root.contains(document.activeElement)`.
    dispose() {
      dismiss.clear();
      if (focusInside) restoreFocus();
    },
  };
}
