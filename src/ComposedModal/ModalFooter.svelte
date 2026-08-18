<script>
  /**
   * @template [Icon=any]
   * @event {{ text: string }} click:button--secondary - Dispatched when a secondary button is clicked. For `secondaryButtonText`, the event is cancelable: call `preventDefault()` to keep the modal open. If not cancelled, the modal closes. Array `secondaryButtons` never auto-close.
   */

  /** Specify the primary button text */
  export let primaryButtonText = "";

  /**
   * Specify the primary button icon.
   * @type {Icon}
   */
  export let primaryButtonIcon = /** @type {Icon} */ (undefined);

  /** Set to `true` to disable the primary button */
  export let primaryButtonDisabled = false;

  /**
   * Set to `true` to show a loading state on the primary button.
   * While loading, the button is non-interactive and submit is suppressed.
   */
  export let primaryButtonLoading = false;

  /**
   * Specify the description for the primary button loading state.
   * Passed to `InlineLoading` as `description`.
   */
  export let primaryButtonLoadingDescription = "Loading";

  /**
   * Specify a class for the primary button.
   * @type {string}
   */
  export let primaryClass = undefined;

  /** Specify the secondary button text */
  export let secondaryButtonText = "";

  /**
   * One or two secondary buttons for the modal footer.
   * Supersedes `secondaryButtonText`. Each entry needs `text`; optional
   * `kind` (defaults to `"secondary"`) and `disabled` pass through to Button.
   * With two entries plus a primary button, the footer uses the three-button layout.
   * @type {ReadonlyArray<{ text: string; kind?: string; disabled?: boolean }>}
   */
  export let secondaryButtons = [];

  /**
   * Specify a class for the secondary button.
   * @type {string}
   */
  export let secondaryClass = undefined;

  /** Set to `true` to use the danger variant */
  export let danger = false;

  import { createEventDispatcher, getContext } from "svelte";
  import Button from "../Button/Button.svelte";
  import InlineLoading from "../InlineLoading/InlineLoading.svelte";

  const dispatch = createEventDispatcher();
  const { closeModal, submit, registerFooter } = getContext(
    "carbon:ComposedModal",
  );
  registerFooter();

  function handlePrimaryClick() {
    if (primaryButtonLoading) return;
    submit();
  }

  function handleSecondaryClick() {
    const shouldContinue = dispatch(
      "click:button--secondary",
      { text: secondaryButtonText },
      { cancelable: true },
    );
    if (shouldContinue) {
      closeModal();
    }
  }
</script>

<div
  class:bx--modal-footer={true}
  class:bx--modal-footer--three-button={secondaryButtons.length === 2}
  {...$$restProps}
>
  {#if secondaryButtons.length > 0}
    {#each secondaryButtons as button (button.text)}
      <Button
        kind={button.kind ?? "secondary"}
        disabled={button.disabled}
        on:click={() => {
          dispatch("click:button--secondary", { text: button.text });
        }}
      >
        {button.text}
      </Button>
    {/each}
  {:else if secondaryButtonText}
    <Button
      kind="secondary"
      class={secondaryClass}
      on:click={handleSecondaryClick}
    >
      {secondaryButtonText}
    </Button>
  {/if}
  {#if primaryButtonText}
    <Button
      kind={danger ? "danger" : "primary"}
      disabled={primaryButtonDisabled || primaryButtonLoading}
      class={primaryClass}
      icon={primaryButtonLoading ? undefined : primaryButtonIcon}
      on:click={handlePrimaryClick}
    >
      {#if primaryButtonLoading}
        <InlineLoading
          status="active"
          description={primaryButtonLoadingDescription}
        />
      {:else}
        {primaryButtonText}
      {/if}
    </Button>
  {/if}
  <slot />
</div>
