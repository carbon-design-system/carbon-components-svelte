// @ts-check
import { tick } from "svelte";
import { returnFocus } from "./focus.js";
import { isImeComposition } from "./ime-composition.js";
import { createHoverFocusPause } from "./pause-on-hover-focus.js";
import { createTimeoutDismiss } from "./timeout-dismiss.js";
import { selectorTabbable, trapFocus } from "./trap-focus.js";

const selectorCloseButton =
  ".bx--inline-notification__close-button, .bx--toast-notification__close-button";

/**
 * Move focus into an actionable notification. Carbon React focuses the
 * action button. Fall back to the close button, then to the notification
 * itself, so focus always lands inside.
 * @param {HTMLElement | null | undefined} root
 * @returns {void}
 */
export function focusActionableNotification(root) {
  if (!root?.isConnected) return;
  const closeButton = root.querySelector(selectorCloseButton);
  const action = Array.from(root.querySelectorAll(selectorTabbable)).find(
    (node) => node !== closeButton,
  );
  const target = action ?? closeButton ?? root;
  if (target instanceof HTMLElement) target.focus();
}

/**
 * Shared open/close + auto-dismiss-timeout + pause-on-hover wiring for
 * `InlineNotification` and `ToastNotification`: closing dispatches a
 * cancelable "close" event (detail `{ timeout }`) and only applies `setOpen(false)`
 * when no listener calls `preventDefault()`; an auto-dismiss timeout closes
 * the same way, with `timeout: true`. Closing while focus is inside returns
 * it to the element focused before focus entered the notification.
 *
 * An actionable notification (`role="alertdialog"`) also moves focus in
 * when it opens, closes on Escape, and wraps Tab inside itself.
 * @param {object} options
 * @param {(
 *   name: string,
 *   detail?: object,
 *   options?: object,
 * ) => boolean} options.dispatch
 * @param {() => boolean} options.getPauseOnHover
 * @param {(open: boolean) => void} options.setOpen
 * @param {() => HTMLElement | null | undefined} [options.getRef]
 * @returns {{
 *   close: (closeFromTimeout?: unknown) => void,
 *   sync: (open: boolean, timeout: number, hasAction?: boolean) => void,
 *   syncFocusOnOpen: (open: boolean, enabled: boolean) => void,
 *   handleActionableKeydown: (
 *     event: KeyboardEvent,
 *     options: { closeOnEscape: boolean, hideCloseButton: boolean },
 *   ) => void,
 *   handleMouseenter: () => void,
 *   handleMouseleave: (event: MouseEvent) => void,
 *   handleFocusIn: (event: FocusEvent) => void,
 *   handleFocusOut: (event: FocusEvent) => void,
 *   setPaused: (paused: boolean) => void,
 *   dispose: () => void,
 * }}
 */
export function createDismissibleNotification({
  dispatch,
  getPauseOnHover,
  setOpen,
  getRef = () => null,
}) {
  const dismiss = createTimeoutDismiss();

  let paused = false;

  const {
    handleMouseenter,
    handleMouseleave,
    handleFocusIn,
    handleFocusOut,
    refresh,
    reset,
  } = createHoverFocusPause(dismiss, getPauseOnHover, () => paused);

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
   * A notification that is actionable or holds an action ignores `timeout`.
   * It stays open until users act on it or close it, as Carbon's usage
   * guidance says. A timer could remove the action before a keyboard or
   * screen reader user reaches it (WCAG 2.2.1).
   * @param {boolean} open
   * @param {number} timeout
   * @param {boolean} [hasAction]
   */
  function sync(open, timeout, hasAction = false) {
    // Also covers a consumer setting `open` to false (e.g. from an action
    // button), which skips `close()`.
    if (wasOpen && !open) {
      restoreFocus();
      reset();
    }
    wasOpen = open;
    dismiss.sync(open, hasAction ? 0 : timeout, () => close(true));
    // `dismiss.sync()` restarts the timer unpaused; keep it paused while
    // the pointer or focus is still inside (e.g. a queue `update()`).
    if (open) refresh();
  }

  let wasOpenForFocus = false;

  /**
   * Focus the action once the notification opens, on mount or when `open`
   * turns true. `enabled` is `actionable && focusOnOpen`.
   * @param {boolean} open
   * @param {boolean} enabled
   */
  function syncFocusOnOpen(open, enabled) {
    if (open && !wasOpenForFocus && enabled) {
      // Also runs during server rendering, where the ref stays unset.
      tick().then(() => focusActionableNotification(getRef()));
    }
    wasOpenForFocus = open;
  }

  /**
   * Escape closes through `close()`, so the close event and focus return
   * work as they do for the close button. Tab wraps inside, as in Carbon
   * React, but only while the keyboard can close the notification.
   * @param {KeyboardEvent} event
   * @param {{ closeOnEscape: boolean, hideCloseButton: boolean }} options
   */
  function handleActionableKeydown(event, { closeOnEscape, hideCloseButton }) {
    if (event.key === "Escape") {
      // Escape that cancels an IME composition is not a close.
      if (!closeOnEscape || isImeComposition(event)) return;
      // Keep a surrounding modal or popover from closing on the same key.
      event.stopPropagation();
      close();
    } else if (event.key === "Tab" && !event.defaultPrevented) {
      // With no Escape and no close button, a trap would have no exit
      // (WCAG 2.1.2, No Keyboard Trap), so let Tab leave.
      if (!closeOnEscape && hideCloseButton) return;
      const container = event.currentTarget;
      if (container instanceof Element) trapFocus({ container, event });
    }
  }

  /**
   * Hold the timer paused, or release it with the time it had left.
   * @param {boolean} value
   */
  function setPaused(value) {
    paused = value;
    refresh();
  }

  return {
    close,
    sync,
    syncFocusOnOpen,
    handleActionableKeydown,
    handleMouseenter,
    handleMouseleave,
    handleFocusIn: trackFocusIn,
    handleFocusOut: trackFocusOut,
    setPaused,
    // Unmounting while focused (e.g. a queue `remove()`/`clear()`) drops
    // focus to `<body>`; by now the root may already be detached, so rely on
    // the tracked flag rather than `root.contains(document.activeElement)`.
    dispose() {
      dismiss.clear();
      if (focusInside) restoreFocus();
    },
  };
}
