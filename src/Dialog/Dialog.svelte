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

  /**
   * Specify an element, or a function returning one, to focus when the dialog
   * closes and the element that opened it has unmounted, for example a
   * deleted row.
   * @type {HTMLElement | (() => HTMLElement | null) | null}
   */
  export let returnFocusTo = null;

  /**
   * Set from the native `returnValue` when the dialog closes; cleared when
   * it opens. Set it by calling `close(value)` on the component instance.
   * @type {string}
   * @bindable readonly
   */
  export let returnValue = "";

  /**
   * Forwarded as the `closedby` attribute, which controls which user
   * interactions can close the dialog. Browsers without support ignore the
   * attribute; `closedby="none"` also disables this component's own
   * backdrop light-dismiss, since that logic runs in Svelte, not natively.
   * @type {"any" | "closerequest" | "none"}
   */
  export let closedby = undefined;

  import { createEventDispatcher } from "svelte";
  import { restoreFocus } from "../utils/focus.js";
  import { createOutsideDismiss } from "../utils/outside-dismiss.js";

  const dispatch = createEventDispatcher();
  const focusReturn = restoreFocus();

  /** @type {DialogCloseTrigger | null} */
  let pendingTrigger = null;

  /** @type {HTMLDialogElement} */
  let dialog;

  /**
   * Close the dialog programmatically, setting `returnValue` like the
   * native `dialog.close(value)` API. Does nothing when the dialog is closed.
   * @param {string} [value]
   */
  export function close(value) {
    if (!dialog?.open) return;
    pendingTrigger = "programmatic";
    dialog.close(value);
  }

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
   */
  function dialogAction(node, options) {
    dialog = node;
    let hasInitialAttribute = node.hasAttribute("open");

    sync(options);

    return {
      update: sync,
      destroy() {},
    };

    function sync({ open: shouldOpen, modal: isModal }) {
      const fromAttribute = hasInitialAttribute;
      hasInitialAttribute = false;

      if (shouldOpen) {
        if (!node.open || fromAttribute) {
          if (fromAttribute) node.removeAttribute("open");
          focusReturn.save();
          returnValue = "";
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
    // closedby="none" disables light-dismiss here too: the attribute is inert
    // without native support, and this component's own logic would still run.
    if (!modal || preventCloseOnClickOutside || closedby === "none") return;
    if (isOnBackdrop(event)) outsideDismiss.release();
  }

  /** @param {Event & { currentTarget: HTMLDialogElement }} event */
  function handleClose(event) {
    const trigger = pendingTrigger ?? "close-button";
    pendingTrigger = null;
    returnValue = event.currentTarget.returnValue;
    open = false;
    dispatch("close", { trigger });
    focusReturn.restore(event.currentTarget, returnFocusTo);
  }
</script>

<dialog
  class:bx--dialog={true}
  class:bx--dialog--modal={modal}
  use:dialogAction={{ open, modal }}
  {closedby}
  {...initialOpen ? { ...$$restProps, open: true } : $$restProps}
  on:cancel={handleCancel}
  on:close={handleClose}
  on:mousedown={handleMouseDown}
  on:mouseup={handleMouseUp}
  on:click
>
  <slot />
</dialog>
