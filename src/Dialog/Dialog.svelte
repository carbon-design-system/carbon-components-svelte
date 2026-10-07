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
  import { restoreFocus } from "../utils/focus.js";

  const dispatch = createEventDispatcher();
  const focusReturn = restoreFocus();

  /** @type {DialogCloseTrigger | null} */
  let pendingTrigger = null;

  /**
   * Initial `open` state rendered as the `open` attribute so a non-modal
   * dialog is visible in server HTML. Modal dialogs need `showModal()` (top
   * layer), which only runs on the client, and `showModal()` throws on a
   * dialog that already carries `open`. Evaluated once, so Svelte never
   * rewrites the attribute afterward; later changes go through `dialogAction`.
   */
  const initialOpen = open && !modal;

  /**
   * Calls `showModal()`/`show()`/`close()` on the native `<dialog>` element
   * so its open state tracks `open`/`modal`. Svelte re-invokes this on every
   * reassignment of `open`/`modal`, not just real transitions, so the guard
   * on the element's own `open` state stops `dispatch("open")` from firing
   * again on a redundant re-run while the dialog is already open.
   * A dialog that arrives with the `open` attribute (server-rendered, or
   * `initialOpen` on the client) has not been shown yet, so the first sync
   * drops the attribute and calls `show()` to run the usual open path.
   */
  function dialogAction(node, options) {
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

  /**
   * Light-dismiss on backdrop: clicks on `::backdrop` are retargeted to the
   * `<dialog>` element, so `event.target === event.currentTarget` means the
   * click was outside the dialog's content children.
   * @param {MouseEvent} event
   */
  function handleClick(event) {
    if (!modal || preventCloseOnClickOutside) return;
    if (event.target !== event.currentTarget) return;
    /** @type {HTMLDialogElement} */
    const node = event.currentTarget;
    pendingTrigger = "backdrop";
    node.close();
  }

  /** @param {Event & { currentTarget: HTMLDialogElement }} event */
  function handleClose(event) {
    const trigger = pendingTrigger ?? "close-button";
    pendingTrigger = null;
    open = false;
    dispatch("close", { trigger });
    focusReturn.restore(event.currentTarget);
  }
</script>

<dialog
  class:bx--dialog={true}
  class:bx--dialog--modal={modal}
  open={initialOpen ? true : undefined}
  use:dialogAction={{ open, modal }}
  {...$$restProps}
  on:cancel={handleCancel}
  on:close={handleClose}
  on:click={handleClick}
  on:click
>
  <slot />
</dialog>
