<script>
  /** Specify the header title */
  export let title = "";

  /** Specify the header subtitle */
  export let subTitle = "";

  /** Set to `true` to hide the step progress indicator (only relevant when there is more than one `InterstitialScreenView`) */
  export let hideProgressIndicator = false;

  /** Specify the ARIA label for the close icon */
  export let iconDescription = "Close";

  /**
   * Specify the text announced when the step changes.
   * @type {(step: number, total: number) => string}
   */
  export let stepText = (step, total) => `Step ${step} of ${total}`;

  /**
   * Specify the assistive text appended to a complete step's name.
   * @type {(status: "complete" | "invalid") => string}
   */
  export let statusText = (status) => status;

  import { getContext } from "svelte";
  import ModalHeader from "../ComposedModal/ModalHeader.svelte";
  import Close from "../icons/Close.svelte";
  import ProgressIndicator from "../ProgressIndicator/ProgressIndicator.svelte";
  import ProgressStep from "../ProgressIndicator/ProgressStep.svelte";

  const { isFullScreen, progStep, views, handleClose } = getContext(
    "carbon:InterstitialScreen",
  );

  $: hasTitle = Boolean(title || subTitle);
  $: isMultiStep = $views.length > 1;
</script>

{#if $isFullScreen}
  <header
    class:bx--modal-header={true}
    class:bx--interstitial-screen__header={true}
    class:bx--interstitial-screen__header--has-title={hasTitle}
    {...$$restProps}
  >
    {#if title}
      <h3 class:bx--modal-header__heading={true} class:bx--type-beta={true}>
        {title}
      </h3>
    {/if}
    {#if subTitle}
      <p class:bx--interstitial-screen__subtitle={true}>{subTitle}</p>
    {/if}
    <button
      type="button"
      aria-label={iconDescription}
      class:bx--modal-close={true}
      on:click={() => handleClose("close")}
    >
      <Close size={20} class="bx--modal-close__icon" aria-hidden="true" />
    </button>
  </header>
{:else}
  <ModalHeader {title} {iconDescription} {...$$restProps}>
    {#if subTitle}
      <p class:bx--interstitial-screen__subtitle={true}>{subTitle}</p>
    {/if}
  </ModalHeader>
{/if}

{#if !hideProgressIndicator && isMultiStep}
  <div class:bx--interstitial-screen__progress={true}>
    <ProgressIndicator
      currentIndex={$progStep}
      preventChangeOnClick
      spaceEqually
      {statusText}
    >
      {#each $views as view, index (view.id)}
        <ProgressStep
          label={view.stepTitle || `Step ${index + 1}`}
          complete={index < $progStep}
        />
      {/each}
    </ProgressIndicator>
    <div aria-live="polite" aria-atomic="true" class:bx--visually-hidden={true}>
      {stepText($progStep + 1, $views.length)}
    </div>
  </div>
{/if}
