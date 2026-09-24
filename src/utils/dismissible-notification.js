// @ts-check
import { createHoverFocusPause } from "./pause-on-hover-focus.js";
import { createTimeoutDismiss } from "./timeout-dismiss.js";

/**
 * Shared open/close + auto-dismiss-timeout + pause-on-hover wiring for
 * `InlineNotification` and `ToastNotification`: closing dispatches a
 * cancelable "close" event (detail `{ timeout }`) and only applies `setOpen(false)`
 * when no listener calls `preventDefault()`; an auto-dismiss timeout closes
 * the same way, with `timeout: true`.
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
 *   handleFocusIn: () => void,
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
    }
  }

  /**
   * @param {boolean} open
   * @param {number} timeout
   */
  function sync(open, timeout) {
    dismiss.sync(open, timeout, () => close(true));
  }

  return {
    close,
    sync,
    handleMouseenter,
    handleMouseleave,
    handleFocusIn,
    handleFocusOut,
    dispose: dismiss.clear,
  };
}
