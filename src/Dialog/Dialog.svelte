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
   * Calls `showModal()`/`show()`/`close()` on the native `<dialog>` element
   * so its open state tracks `open`/`modal`. Svelte re-invokes this on every
   * reassignment of `open`/`modal`, not just real transitions, so the guard
   * on the element's own `open` state stops `dispatch("open")` from firing
   * again on a redundant re-run while the dialog is already open.
   */
  function dialogAction(node, params) {
    sync(params);

    return {
      update: sync,
      destroy() {},
    };

    function sync({ open: shouldOpen, modal: isModal }) {
      if (shouldOpen) {
        if (!node.open) {
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

  function handleClose() {
    const trigger = pendingTrigger ?? "close-button";
    pendingTrigger = null;
    open = false;
    dispatch("close", { trigger });
    focusReturn.restore();
  }
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<dialog
  class:bx--dialog={true}
  class:bx--dialog--modal={modal}
  use:dialogAction={{ open, modal }}
  {...$$restProps}
  on:cancel={handleCancel}
  on:close={handleClose}
  on:click={handleClick}
  on:click
>
  <slot />
</dialog>
