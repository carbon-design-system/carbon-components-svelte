<script>
  /**
   * @typedef {"escape-key" | "backdrop" | "close-button" | "programmatic"} DialogCloseTrigger
   * @restProps {dialog}
   * @slot {{}}
   * @event {null} open
   * @event {{ trigger: DialogCloseTrigger }} close
   */

  /**
   * Set to `true` to open the dialog.
   * @bindable writable
   */
  export let open = false;

  /**
   * Set to `true` to render the dialog as a modal using `showModal()`.
   * When `false`, the dialog opens non-modally using `show()`.
   * Changing `modal` while `open` is `true` has no effect until the dialog closes and reopens.
   */
  export let modal = false;

  /**
   * Set to `true` to prevent the dialog from closing when clicking the backdrop.
   * Only applies when `modal` is `true`.
   */
  export let preventCloseOnClickOutside = false;

  import { createEventDispatcher } from "svelte";
  import { DIALOG_CLOSE_MS } from "../constants/timing.js";
  import { restoreFocus } from "../utils/focus.js";
  import { createOutsideDismiss } from "../utils/outside-dismiss.js";

  const dispatch = createEventDispatcher();
  const focusReturn = restoreFocus();

  /** @type {DialogCloseTrigger | null} */
  let pendingTrigger = null;

  /** @type {HTMLDialogElement} */
  let dialog;

  /** Whether the exit motion is running, before `close()` is called. */
  let closing = false;

  /** @type {(() => void) | null} Stops the exit motion's hold. */
  let releaseHold = null;

  /**
   * Server-rendered `open` attribute so a non-modal dialog is visible in
   * server HTML. Modal dialogs need `showModal()` (top layer), which only
   * runs on the client, and `showModal()` throws on a dialog that already
   * carries `open`. Server-only: Svelte 3/4 re-apply every attribute on a
   * spread element on each update, which would undo `dialogAction`.
   */
  const initialOpen = typeof document === "undefined" && open && !modal;

  /**
   * Calls `showModal()`/`show()`/`close()` on the native `<dialog>` element
   * so its open state tracks `open`/`modal`. Svelte re-invokes this on every
   * reassignment of `open`/`modal`, not just real transitions, so the guard
   * on the element's own `open` state stops `dispatch("open")` from firing
   * again on a redundant re-run while the dialog is already open.
   * A dialog that arrives with the `open` attribute (server-rendered and
   * hydrated by Svelte 5) has not been shown yet, so the first sync
   * drops the attribute and calls `show()` to run the usual open path.
   * Closing waits for the exit motion (see `requestClose`), and opening
   * again during that wait cancels the close.
   * @param {HTMLDialogElement} node
   * @param {{ open: boolean; modal: boolean }} options
   */
  function dialogAction(node, options) {
    dialog = node;
    let hasInitialAttribute = node.hasAttribute("open");

    sync(options);

    return {
      update: sync,
      destroy() {
        releaseHold?.();
      },
    };

    /** @param {{ open: boolean; modal: boolean }} options */
    function sync({ open: shouldOpen, modal: isModal }) {
      const fromAttribute = hasInitialAttribute;
      hasInitialAttribute = false;

      if (shouldOpen) {
        if (releaseHold) {
          releaseHold();
          pendingTrigger = null;
        } else if (!node.open || fromAttribute) {
          if (fromAttribute) node.removeAttribute("open");
          focusReturn.save();
          if (isModal) {
            node.showModal();
          } else {
            node.show();
          }
          dispatch("open");
        }
      } else if (node.open) {
        pendingTrigger = pendingTrigger ?? "programmatic";
        requestClose();
      }
    }
  }

  /**
   * Whether the dialog can play its exit motion: it is open, and the user
   * has not asked for reduced motion (the CSS drops the motion then too).
   */
  function canHold() {
    return (
      dialog.open &&
      !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    );
  }

  /**
   * Closes the dialog after its exit motion. A native `<dialog>` leaves the
   * top layer as soon as `close()` runs, so the `--closing` class starts the
   * fade and slide first, and `close()` follows when the box's transition
   * ends. The timeout is the fallback, as `transitionend` never fires when
   * the duration is zero or the dialog is hidden.
   * @param {string} [returnValue]
   */
  function requestClose(returnValue) {
    if (releaseHold) return;
    if (!canHold()) {
      dialog.close(returnValue);
      return;
    }

    const node = dialog;
    const timer = setTimeout(finish, DIALOG_CLOSE_MS);
    /** @param {TransitionEvent} event */
    const onEnd = (event) => {
      if (event.target === node && event.propertyName === "transform") finish();
    };

    node.addEventListener("transitionend", onEnd);
    closing = true;
    releaseHold = () => {
      clearTimeout(timer);
      node.removeEventListener("transitionend", onEnd);
      releaseHold = null;
      closing = false;
    };

    function finish() {
      releaseHold?.();
      node.close(returnValue);
    }
  }

  /** @param {Event} event */
  function handleCancel(event) {
    if (releaseHold) {
      event.preventDefault();
      return;
    }
    pendingTrigger = "escape-key";
    // Only a cancelable `cancel` can be held back; the browser closes the
    // dialog at once when it is not (a second Escape, with no input between).
    if (event.cancelable && canHold()) {
      event.preventDefault();
      requestClose();
    }
  }

  /**
   * Closes through the exit motion on a `<form method="dialog">` submit,
   * which the browser would otherwise close at once.
   * @param {SubmitEvent & { target: HTMLFormElement }} event
   */
  function handleSubmit(event) {
    const { target: form } = event;
    const submitter = /** @type {HTMLButtonElement | null} */ (event.submitter);
    if (event.defaultPrevented || !canHold()) return;
    if (form.getAttribute("method")?.toLowerCase() !== "dialog") return;
    event.preventDefault();
    requestClose(
      submitter?.hasAttribute("value") ? submitter.value : undefined,
    );
  }

  const outsideDismiss = createOutsideDismiss(() => {
    pendingTrigger = "backdrop";
    requestClose();
  });

  /**
   * Clicks on `::backdrop` are retargeted to the `<dialog>` element, but so
   * are clicks on its own padding, so the pointer must also be outside the
   * dialog's box.
   * @param {MouseEvent} event
   */
  function isOnBackdrop(event) {
    if (event.target !== dialog) return false;
    const { left, right, top, bottom } = dialog.getBoundingClientRect();
    const { clientX: x, clientY: y } = event;
    return !(x >= left && x < right && y >= top && y < bottom);
  }

  /** @param {MouseEvent} event */
  function handleMouseDown(event) {
    if (isOnBackdrop(event)) outsideDismiss.pressOutside();
    else outsideDismiss.pressInside();
  }

  /** @param {MouseEvent} event */
  function handleMouseUp(event) {
    if (!modal || preventCloseOnClickOutside) return;
    if (isOnBackdrop(event)) outsideDismiss.release();
  }

  /** @param {Event & { currentTarget: HTMLDialogElement }} event */
  function handleClose(event) {
    const trigger = pendingTrigger ?? "close-button";
    pendingTrigger = null;
    releaseHold?.();
    open = false;
    dispatch("close", { trigger });
    focusReturn.restore(event.currentTarget);
  }
</script>

<dialog
  class:bx--dialog={true}
  class:bx--dialog--modal={modal}
  class:bx--dialog--closing={closing}
  use:dialogAction={{ open, modal }}
  {...initialOpen ? { ...$$restProps, open: true } : $$restProps}
  on:cancel={handleCancel}
  on:submit={handleSubmit}
  on:close={handleClose}
  on:mousedown={handleMouseDown}
  on:mouseup={handleMouseUp}
  on:click
>
  <slot />
</dialog>
