<script>
  /**
   * @restProps {div}
   * @slot {{}}
   * @slot {{}} titleChildren
   * @event confirm
   * @event {{ error: unknown }} confirm:error
   * @event cancel
   * @type {object}
   * @property {"escape-key" | "outside-click" | "close-button" | "cancel-button"} trigger
   * @event close
   * @type {object}
   * @property {"escape-key" | "outside-click" | "close-button" | "programmatic"} trigger
   */

  /**
   * Set to `true` to open the modal.
   * @bindable writable
   */
  export let open = false;

  /**
   * Set the kind of confirmation.
   * `"danger"` uses Modal's danger variant and `"warning"` adds a warning
   * icon next to the heading; both are announced as an alert dialog.
   * `"info"` is a plain dialog.
   * @type {"danger" | "warning" | "info"}
   */
  export let kind = "danger";

  /**
   * Specify the modal heading.
   * @type {string}
   */
  export let title;

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

  /**
   * Specify the label for the type-to-confirm input.
   * @type {(phrase: string) => string}
   */
  export let confirmationLabel = (phrase) => `Type ${phrase} to confirm`;

  /**
   * Specify the work to run on confirm. When it returns a promise, the
   * modal shows its loading state until the promise settles: it closes on
   * success, and on failure stays open and dispatches `confirm:error`.
   * Without it, or when it returns nothing, the modal closes on confirm.
   * @type {undefined | (() => void | Promise<unknown>)}
   */
  export let confirm = undefined;

  /**
   * Set to `true` to show a loading state on the confirm button and block
   * closing, for work the app tracks itself. `confirm` sets this state on
   * its own.
   */
  export let loading = false;

  /** Specify the description for the confirm button loading state */
  export let loadingDescription = "Working";

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

  import { afterUpdate, createEventDispatcher, tick } from "svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import Modal from "../Modal/Modal.svelte";
  import TextInput from "../TextInput/TextInput.svelte";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();

  let phraseValue = "";
  let prevOpen = false;
  let phraseInputRef = null;
  /** Whether a `confirm` promise is in flight. */
  let pending = false;
  /** Counts opens, so work from an earlier opening can't close a later one. */
  let session = 0;

  $: busy = loading || pending;

  // A pasted phrase often brings a trailing space, and the same accented
  // text can arrive in a different Unicode form.
  /** @param {string} text */
  const canonical = (text) => text.trim().normalize("NFC");
  $: phraseMatches =
    confirmationPhrase == null ||
    canonical(phraseValue) === canonical(confirmationPhrase);

  $: phraseLabel =
    confirmationPhrase == null ? "" : confirmationLabel(confirmationPhrase);
  // Page translators would translate the phrase too, so the user would type
  // a word that never matches; the phrase is marked not to translate.
  $: phraseAt =
    confirmationPhrase == null ? -1 : phraseLabel.indexOf(confirmationPhrase);

  $: {
    if (!prevOpen && open) {
      phraseValue = "";
      session += 1;
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

  async function handleSubmit() {
    // A second Enter or click while the first is still running is ignored.
    if (!phraseMatches || busy) return;
    dispatch("confirm");
    const current = session;
    let result;
    try {
      result = confirm?.();
    } catch (error) {
      dispatch("confirm:error", { error });
      return;
    }
    if (typeof result?.then !== "function") {
      open = false;
      return;
    }
    pending = true;
    try {
      await result;
      if (current === session) open = false;
    } catch (error) {
      if (current === session) dispatch("confirm:error", { error });
    } finally {
      if (current === session) pending = false;
    }
  }

  function handleClose(event) {
    const { trigger } = event.detail;
    // `open` was set to false, by this component after a confirm or cancel
    // or by the app after its work succeeded: report it, but it's no cancel.
    if (trigger === "programmatic") {
      dispatch("close", event.detail);
      return;
    }
    if (busy || !dispatch("close", event.detail, { cancelable: true })) {
      event.preventDefault();
      return;
    }
    dispatch("cancel", { trigger });
  }

  function handleClickSecondary() {
    dispatch("cancel", { trigger: "cancel-button" });
    open = false;
  }

  // The confirm button is disabled while loading, which drops the focus it
  // had. If the work fails and the modal stays open, put focus back on it,
  // a tick later so Modal has re-enabled the button first.
  let prevBusy = busy;
  afterUpdate(() => {
    if (prevBusy && !busy && open) {
      tick().then(() => {
        if (!open || ref?.contains(document.activeElement)) return;
        /** @type {null | HTMLButtonElement} */ (
          ref?.querySelector(".bx--modal-footer .bx--btn:last-child")
        )?.focus();
      });
    }
    prevBusy = busy;
  });
</script>

<Modal
  bind:open
  bind:ref
  {id}
  danger={kind === "danger"}
  alert={kind !== "info"}
  {size}
  modalHeading={title}
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
    <slot name="titleChildren">{title}</slot>
  </svelte:fragment>
  <slot />
  {#if confirmationPhrase != null}
    <div class:bx--confirm-modal__phrase={true}>
      <TextInput
        bind:ref={phraseInputRef}
        id="{id}-confirm-modal-phrase"
        bind:value={phraseValue}
        autocomplete="off"
        autocapitalize="off"
        autocorrect="off"
        spellcheck="false"
        data-1p-ignore
        data-lpignore="true"
        data-bwignore
        data-form-type="other"
      >
        <svelte:fragment slot="labelChildren">
          {#if phraseAt === -1}
            {phraseLabel}
          {:else}
            {phraseLabel.slice(0, phraseAt)}<span
              class="bx--confirm-modal__phrase-text notranslate"
              translate="no"
              >{confirmationPhrase}</span
            >{phraseLabel.slice(phraseAt + confirmationPhrase.length)}
          {/if}
        </svelte:fragment>
      </TextInput>
    </div>
  {/if}
</Modal>
