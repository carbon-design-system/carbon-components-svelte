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

  const { handleMouseenter, handleMouseleave, handleFocusIn, handleFocusOut } =
    createHoverFocusPause(dismiss, getPauseOnHover);

  /** @type {HTMLElement | null} */
  let prevFocus = null;
  /** @type {Element | null} */
  let root = null;
  let wasOpen = false;

  /**
   * Remember where focus came from when it enters from outside, so closing
   * (which unmounts the focused close or action button) can send it back.
   * @param {FocusEvent} event
   */
  function trackFocusIn(event) {
    handleFocusIn();
    const current = event.currentTarget;
    if (!(current instanceof Element)) return;
    root = current;
    const from = event.relatedTarget;
    if (!(from instanceof Node && current.contains(from))) {
      prevFocus = from instanceof HTMLElement ? from : null;
    }
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
    if (wasOpen && !open) restoreFocus();
    wasOpen = open;
    dismiss.sync(open, timeout, () => close(true));
  }

  return {
    close,
    sync,
    handleMouseenter,
    handleMouseleave,
    handleFocusIn: trackFocusIn,
    handleFocusOut,
    dispose: dismiss.clear,
  };
}
