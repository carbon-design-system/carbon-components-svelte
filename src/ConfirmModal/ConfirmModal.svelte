<script>
  /**
   * @restProps {div}
   * @slot {{}}
   * @slot {{}} headingChildren
   * @event confirm
   * @event cancel
   * @type {object}
   * @property {"escape-key" | "outside-click" | "close-button" | "cancel-button" | "programmatic"} trigger
   */

  /**
   * Set to `true` to open the modal.
   * @bindable writable
   */
  export let open = false;

  /**
   * Set the kind of confirmation.
   * `"danger"` uses Modal's danger variant; `"warning"` uses alert mode with
   * a warning icon next to the heading; `"info"` is plain.
   * @type {"danger" | "warning" | "info"}
   */
  export let kind = "danger";

  /**
   * Specify the modal heading.
   * @type {string}
   */
  export let heading;

  /**
   * Specify the modal label.
   * @type {string}
   */
  export let label = undefined;

  /** Specify the confirm button text */
  export let confirmText = "Confirm";

  /** Specify the cancel button text */
  export let cancelText = "Cancel";

  /**
   * When set, the user must type this exact phrase before the confirm
   * button becomes enabled.
   * @type {string}
   */
  export let confirmationPhrase = undefined;

  /** Specify the label for the type-to-confirm input. `{phrase}` is replaced with `confirmationPhrase`. */
  export let confirmationLabel = "Type {phrase} to confirm";

  /** Set to `true` to show a loading state on the confirm button and block cancel */
  export let loading = false;

  /** Specify the description for the confirm button loading state */
  export let loadingDescription = "Working";

  /** Set to `false` when the consumer awaits work and closes the modal manually */
  export let closeOnConfirm = true;

  /**
   * Specify work to run on confirm, such as a request. While a returned
   * promise is pending, the confirm button shows its loading state and the
   * modal can't be cancelled, as with `loading`. When it resolves, `confirm`
   * is dispatched and the modal closes (unless `closeOnConfirm` is `false`).
   * When it rejects, the modal stays open and shows the error.
   * @type {undefined | (() => void | Promise<void>)}
   */
  export let onConfirm = undefined;

  /** Specify the error shown when `onConfirm` rejects without a message */
  export let errorText = "Something went wrong. Try again.";

  /**
   * Set the size of the modal.
   * @type {"xs" | "sm" | "lg"}
   */
  export let size = "xs";

  /** Set to `false` to allow closing the modal when clicking outside */
  export let preventCloseOnClickOutside = true;

  /** Set an id for the top-level element */
  export let id = uniqueId();

  /**
   * Obtain a reference to the top-level HTML element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher } from "svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import Modal from "../Modal/Modal.svelte";
  import InlineNotification from "../Notification/InlineNotification.svelte";
  import TextInput from "../TextInput/TextInput.svelte";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();

  let phraseValue = "";
  let prevOpen = false;
  let phraseInputRef = null;
  /** Whether `onConfirm` is running. */
  let pending = false;
  /** @type {string | undefined} */
  let error = undefined;

  $: busy = loading || pending;

  $: phraseMatches =
    confirmationPhrase == null || phraseValue === confirmationPhrase;

  $: {
    if (!prevOpen && open) {
      phraseValue = "";
      error = undefined;
    }
    prevOpen = open;
  }

  // Destructive confirms focus the cancel button first so a stray Enter or
  // Space doesn't confirm accidentally; the confirm button is not reachable
  // via Modal's default `[data-modal-primary-focus]` selector, so the
  // secondary button is targeted directly by class.
  $: selectorPrimaryFocus =
    confirmationPhrase == null
      ? ".bx--modal-footer .bx--btn--secondary"
      : `#${id}-confirm-modal-phrase`;

  // Setting `open` here (rather than going through Modal's own `close()`)
  // still trips Modal's prevOpen tracker, which defers a "programmatic"
  // close dispatch via tick(). This flag tells `handleClose` to ignore that
  // echo instead of dispatching a second, misleading "cancel".
  let selfClosing = false;

  async function handleSubmit() {
    if (!phraseMatches || busy) return;
    if (onConfirm) {
      pending = true;
      error = undefined;
      try {
        await onConfirm();
      } catch (reason) {
        error =
          reason instanceof Error && reason.message
            ? reason.message
            : errorText;
        return;
      } finally {
        pending = false;
      }
    }
    dispatch("confirm");
    if (closeOnConfirm) {
      selfClosing = true;
      open = false;
    }
  }

  function handleClose(event) {
    if (selfClosing) {
      selfClosing = false;
      return;
    }
    if (busy) {
      event.preventDefault();
      return;
    }
    dispatch("cancel", { trigger: event.detail.trigger });
  }

  function handleClickSecondary() {
    if (busy) return;
    dispatch("cancel", { trigger: "cancel-button" });
    selfClosing = true;
    open = false;
  }
</script>

<Modal
  bind:open
  bind:ref
  {id}
  danger={kind === "danger"}
  alert={kind === "warning"}
  {size}
  modalHeading={heading}
  modalLabel={label}
  primaryButtonText={confirmText}
  primaryButtonDisabled={!phraseMatches || busy}
  primaryButtonLoading={busy}
  primaryButtonLoadingDescription={loadingDescription}
  secondaryButtons={[{ text: cancelText, disabled: busy }]}
  preventCloseOnClickOutside={preventCloseOnClickOutside || busy}
  {selectorPrimaryFocus}
  {...$$restProps}
  on:open
  on:close={handleClose}
  on:close
  on:transitionend
  on:submit={handleSubmit}
  on:click:button--secondary={handleClickSecondary}
>
  <svelte:fragment slot="heading">
    {#if kind === "warning"}
      <WarningAltFilled
        size={20}
        class="bx--confirm-modal__heading-icon"
        aria-hidden="true"
      />
    {/if}
    <slot name="headingChildren">{heading}</slot>
  </svelte:fragment>
  <slot />
  {#if confirmationPhrase != null}
    <div class:bx--confirm-modal__phrase={true}>
      <TextInput
        bind:ref={phraseInputRef}
        id="{id}-confirm-modal-phrase"
        labelText={confirmationLabel.replace("{phrase}", confirmationPhrase)}
        disabled={pending}
        bind:value={phraseValue}
      />
    </div>
  {/if}
  {#if error}
    <InlineNotification
      fullWidth
      lowContrast
      hideCloseButton
      kind="error"
      title={error}
    />
  {/if}
</Modal>
