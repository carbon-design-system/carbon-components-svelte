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
   * Specify an element—or a function returning one—to focus when the dialog
   * closes. Use when the element that opened the dialog may unmount while
   * the dialog is open, for example a deleted row.
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

  /** Set to `true` to use the light variant */
  export let light = false;

  import { createEventDispatcher } from "svelte";
  import { restoreFocus } from "../utils/focus.js";

  const dispatch = createEventDispatcher();
  const focusReturn = restoreFocus();

  /** @type {DialogCloseTrigger | null} */
  let pendingTrigger = null;

  /** @type {HTMLDialogElement | null} */
  let dialogRef = null;

  /**
   * Close the dialog programmatically, setting `returnValue` like the
   * native `dialog.close(value)` API.
   * @param {string} [value]
   */
  export function close(value) {
    pendingTrigger = "programmatic";
    dialogRef.returnValue = value;
    dialogRef.close(value);
  }

  /**
   * Calls `showModal()`/`show()`/`close()` on the native `<dialog>` element
   * so its open state tracks `open`/`modal`. Svelte re-invokes this on every
   * reassignment of `open`/`modal`, not just real transitions, so the guard
   * on the element's own `open` state stops `dispatch("open")` from firing
   * again on a redundant re-run while the dialog is already open.
   */
  function dialogAction(node, options) {
    sync(options);

    return {
      update: sync,
      destroy() {},
    };

    function sync({ open: shouldOpen, modal: isModal }) {
      if (shouldOpen) {
        if (!node.open) {
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

  /**
   * Light-dismiss on backdrop: clicks on `::backdrop` are retargeted to the
   * `<dialog>` element, so `event.target === event.currentTarget` means the
   * click was outside the dialog's content children.
   * @param {MouseEvent} event
   */
  function handleClick(event) {
    // closedby="none" disables light-dismiss here since the browser attribute
    // is inert without native support and this component's own logic still runs.
    if (!modal || preventCloseOnClickOutside || closedby === "none") return;
    if (event.target !== event.currentTarget) return;
    /** @type {HTMLDialogElement} */
    const node = event.currentTarget;
    pendingTrigger = "backdrop";
    node.close();
  }

  function handleClose() {
    const trigger = pendingTrigger ?? "close-button";
    pendingTrigger = null;
    returnValue = dialogRef.returnValue;
    open = false;
    dispatch("close", { trigger });
    focusReturn.restore(() =>
      typeof returnFocusTo === "function" ? returnFocusTo() : returnFocusTo,
    );
  }
</script>

<dialog
  bind:this={dialogRef}
  class:bx--dialog={true}
  class:bx--dialog--modal={modal}
  class:bx--dialog--light={light}
  use:dialogAction={{ open, modal }}
  {closedby}
  {...$$restProps}
  on:cancel={handleCancel}
  on:close={handleClose}
  on:click={handleClick}
  on:click
>
  <slot />
</dialog>
