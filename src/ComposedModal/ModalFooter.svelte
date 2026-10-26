<script>
  /**
   * @template {import("../utils/icon-component.js").IconComponent} [Icon=any]
   * @event {{ text: string }} click:button--secondary - Dispatched when a secondary button is clicked. For `secondaryButtonText`, the event is cancelable: call `preventDefault()` to keep the modal open. If not cancelled, the modal closes. Array `secondaryButtons` never auto-close.
   * @event {null} loading:success - Dispatched when `loadingStatus` is `"finished"`, after the `InlineLoading` success delay.
   */

  /** Specify the primary button text */
  export let primaryButtonText = "";

  /**
   * Specify the primary button icon.
   * @type {Icon | undefined}
   */
  export let primaryButtonIcon = /** @type {Icon | undefined} */ (undefined);

  /** Set to `true` to disable the primary button */
  export let primaryButtonDisabled = false;

  /**
   * Set to `true` to show a loading state on the primary button.
   * While loading, the button is non-interactive and submit is suppressed.
   * Same as `loadingStatus="active"`, except that the secondary buttons
   * stay enabled. `loadingStatus` wins when it is not `"inactive"`.
   */
  export let primaryButtonLoading = false;

  /**
   * Set the loading status of the footer.
   * Any status other than `"inactive"` shows `InlineLoading` with that
   * status in the primary button, disables the footer buttons, and
   * suppresses submit. `"finished"` dispatches `loading:success` after the
   * success delay.
   * @type {"inactive" | "active" | "finished" | "error"}
   */
  export let loadingStatus = "inactive";

  /**
   * Specify the description for the primary button loading state.
   * Passed to `InlineLoading` as `description`.
   */
  export let primaryButtonLoadingDescription = "Loading";

  /**
   * Specify the description for the primary button loading icon.
   * Passed to `InlineLoading` as `iconDescription`.
   * @type {string | undefined}
   */
  export let primaryButtonLoadingIconDescription = undefined;

  /**
   * Specify a class for the primary button.
   * @type {string | undefined}
   */
  export let primaryClass = undefined;

  /** Specify the secondary button text */
  export let secondaryButtonText = "";

  /**
   * Set to `true` to show a loading state on the secondary button.
   * Only applies to the `secondaryButtonText` path (not `secondaryButtons`).
   * While loading, the button is non-interactive.
   */
  export let secondaryButtonLoading = false;

  /**
   * Specify the description for the secondary button loading state.
   * Passed to `InlineLoading` as `description`.
   */
  export let secondaryButtonLoadingDescription = "Loading";

  /**
   * One or two secondary buttons for the modal footer.
   * Supersedes `secondaryButtonText`. Each entry needs `text`; optional
   * `kind` (defaults to `"secondary"`), `disabled`, `loading`, and
   * `loadingDescription` (defaults to `"Loading"`) pass through to Button /
   * the loading state. With two entries plus a primary button, the footer
   * uses the three-button layout.
   * @type {ReadonlyArray<{ text: string; kind?: import("../Button/Button.svelte").ButtonProps["kind"]; disabled?: boolean; loading?: boolean; loadingDescription?: string }>}
   */
  export let secondaryButtons = [];

  /**
   * Specify a class for the secondary button.
   * @type {string | undefined}
   */
  export let secondaryClass = undefined;

  /** Set to `true` to use the danger variant */
  export let danger = false;

  import { createEventDispatcher, getContext, onMount } from "svelte";
  import Button from "../Button/Button.svelte";
  import InlineLoading from "../InlineLoading/InlineLoading.svelte";

  const dispatch = createEventDispatcher();
  const { closeModal, submit, registerFooter } = getContext(
    "carbon:ComposedModal",
  );
  // A footer makes the modal transactional, so an outside click keeps it
  // open by default. Register during init, as ModalHeader does.
  const unregisterFooter = registerFooter();
  onMount(() => unregisterFooter);

  $: footerBusy = Boolean(loadingStatus) && loadingStatus !== "inactive";
  // `primaryButtonLoading` is the boolean form of "active"; a status
  // other than "inactive" takes precedence.
  $: primaryStatus = footerBusy
    ? loadingStatus
    : primaryButtonLoading
      ? "active"
      : "inactive";
  $: primaryBusy = primaryStatus !== "inactive";

  function handlePrimaryClick() {
    if (primaryBusy) return;
    submit();
  }

  function handleSecondaryClick() {
    if (secondaryButtonLoading || footerBusy) return;
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
  aria-busy={primaryStatus === "active" ? "true" : undefined}
  {...$$restProps}
>
  {#if secondaryButtons.length > 0}
    {#each secondaryButtons as button (button.text)}
      <Button
        size="default"
        kind={button.kind ?? "secondary"}
        disabled={button.disabled || button.loading || footerBusy}
        on:click={() => {
          if (button.loading || footerBusy) return;
          dispatch("click:button--secondary", { text: button.text });
        }}
      >
        {#if button.loading}
          <InlineLoading
            class="bx--inline-loading--btn"
            status="active"
            description={button.loadingDescription ?? "Loading"}
          />
        {:else}
          {button.text}
        {/if}
      </Button>
    {/each}
  {:else if secondaryButtonText}
    <Button
      size="default"
      kind="secondary"
      class={secondaryClass}
      disabled={secondaryButtonLoading || footerBusy}
      on:click={handleSecondaryClick}
    >
      {#if secondaryButtonLoading}
        <InlineLoading
          class="bx--inline-loading--btn"
          status="active"
          description={secondaryButtonLoadingDescription}
        />
      {:else}
        {secondaryButtonText}
      {/if}
    </Button>
  {/if}
  {#if primaryButtonText}
    <Button
      size="default"
      kind={danger ? "danger" : "primary"}
      disabled={primaryButtonDisabled || primaryBusy}
      class={primaryClass}
      icon={primaryBusy ? undefined : primaryButtonIcon}
      on:click={handlePrimaryClick}
    >
      {#if primaryBusy}
        <InlineLoading
          class="bx--inline-loading--btn"
          status={primaryStatus}
          description={primaryButtonLoadingDescription}
          iconDescription={primaryButtonLoadingIconDescription}
          on:success={() => dispatch("loading:success")}
        />
      {:else}
        {primaryButtonText}
      {/if}
    </Button>
  {/if}
  <slot />
</div>
