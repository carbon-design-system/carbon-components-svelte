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
  import { createOutsideDismiss } from "../utils/outside-dismiss.js";
  import { createOverlay } from "../utils/overlay-stack.js";

  const dispatch = createEventDispatcher();

  /** @type {DialogCloseTrigger | null} */
  let pendingTrigger = null;

  // An open dialog is a layer in the overlay stack, so a menu or tooltip
  // opened over it takes Escape first. A modal one is in the browser's top
  // layer: the browser makes the page behind inert and closes the dialog
  // on Escape itself, so the stack leaves both to it.
  const stack = createOverlay({
    kind: "dialog",
    element: () => dialog,
    escape: false,
    outside: "ignore",
    onDismiss: () => {},
  });

  /** @type {HTMLDialogElement} */
  let dialog;

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
        stack.close();
      },
    };

    /** @param {{ open: boolean; modal: boolean }} options */
    function sync({ open: shouldOpen, modal: isModal }) {
      const fromAttribute = hasInitialAttribute;
      hasInitialAttribute = false;

      if (shouldOpen) {
        if (!node.open || fromAttribute) {
          if (fromAttribute) node.removeAttribute("open");
          stack.update({
            modal: isModal,
            native: isModal,
            escape: isModal ? "native" : false,
          });
          stack.open();
          if (isModal) {
            node.showModal();
          } else {
            node.show();
          }
          dispatch("open");
        }
      } else if (node.open) {
        pendingTrigger = pendingTrigger ?? "programmatic";
        node.close();
      }
    }
  }

  function handleCancel() {
    pendingTrigger = "escape-key";
  }

  const outsideDismiss = createOutsideDismiss(() => {
    pendingTrigger = "backdrop";
    dialog.close();
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
    stack.close();
    open = false;
    dispatch("close", { trigger });
    stack.restoreFocus(event.currentTarget);
  }
</script>

<dialog
  class:bx--dialog={true}
  class:bx--dialog--modal={modal}
  use:dialogAction={{ open, modal }}
  {...initialOpen ? { ...$$restProps, open: true } : $$restProps}
  on:cancel={handleCancel}
  on:close={handleClose}
  on:mousedown={handleMouseDown}
  on:mouseup={handleMouseUp}
  on:click
>
  <slot />
</dialog>
