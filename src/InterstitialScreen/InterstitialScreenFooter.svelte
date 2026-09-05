<script>
  /**
   * @event {{ actionType: "start" | "skip" | "back" | "next" }} action - Dispatched synchronously on any footer button press, before the default Skip/Back/Next/Get-Started behavior runs. Cancelable: call `preventDefault()` to take over the button press yourself (for example, to run async work and set `loadingAction`, then call `handleGotoStep`/close the screen manually).
   */

  /** Specify the "Next" button text */
  export let nextButtonText = "Next";

  /** Specify the "Back" button text */
  export let previousButtonText = "Back";

  /** Specify the "Skip" button text. Set to `""` to hide the Skip button */
  export let skipButtonText = "Skip";

  /** Specify the final step's button text */
  export let startButtonText = "Get Started";

  /**
   * Set to the action name of a pending async button press to show that
   * button's `InlineLoading` state and disable the other buttons. Pair with
   * `preventDefault()` on the `action` event.
   * @bindable writable
   * @type {"" | "start" | "skip" | "back" | "next"}
   */
  export let loadingAction = "";

  import { createEventDispatcher, getContext, tick } from "svelte";
  import Button from "../Button/Button.svelte";
  import ModalFooter from "../ComposedModal/ModalFooter.svelte";
  import InlineLoading from "../InlineLoading/InlineLoading.svelte";
  import ArrowRight from "../icons/ArrowRight.svelte";

  const dispatch = createEventDispatcher();
  const { isFullScreen, progStep, views, handleGotoStep, handleClose } =
    getContext("carbon:InterstitialScreen");

  $: stepCount = $views.length;
  $: isMultiStep = stepCount > 1;
  $: progStepCeil = stepCount - 1;
  $: showSkip = isMultiStep && skipButtonText !== "";
  $: showBack = isMultiStep && $progStep > 0;
  $: showNext = isMultiStep && $progStep < progStepCeil;
  $: showStart = !isMultiStep || $progStep === progStepCeil;

  let primaryButtonRef = null;

  // Move focus to the Next/Get-Started button on mount and on every step
  // change (the reactive statement's first run covers mount).
  $: if ($progStep >= 0) {
    tick().then(() => primaryButtonRef?.focus?.());
  }

  /**
   * @type {(actionType: "start" | "skip" | "back" | "next") => void}
   */
  function handleAction(actionType) {
    if (loadingAction) return;

    const shouldContinue = dispatch(
      "action",
      { actionType },
      { cancelable: true },
    );
    if (!shouldContinue) return;

    if (actionType === "next" || actionType === "back") {
      handleGotoStep($progStep + (actionType === "next" ? 1 : -1));
    } else {
      handleClose(actionType);
    }
  }
</script>

{#if $isFullScreen}
  <div
    class:bx--modal-footer={true}
    class:bx--interstitial-screen__footer={true}
    {...$$restProps}
  >
    {#if showSkip}
      <Button
        kind="ghost"
        disabled={Boolean(loadingAction)}
        on:click={() => handleAction("skip")}
      >
        {skipButtonText}
      </Button>
    {/if}
    {#if showBack}
      <Button
        kind="secondary"
        disabled={Boolean(loadingAction)}
        on:click={() => handleAction("back")}
      >
        {#if loadingAction === "back"}
          <InlineLoading status="active" description={previousButtonText} />
        {:else}
          {previousButtonText}
        {/if}
      </Button>
    {/if}
    {#if showNext}
      <Button
        bind:ref={primaryButtonRef}
        disabled={Boolean(loadingAction)}
        on:click={() => handleAction("next")}
      >
        {#if loadingAction === "next"}
          <InlineLoading status="active" description={nextButtonText} />
        {:else}
          {nextButtonText}
        {/if}
      </Button>
    {/if}
    {#if showStart}
      <Button
        bind:ref={primaryButtonRef}
        icon={isMultiStep ? ArrowRight : undefined}
        disabled={Boolean(loadingAction)}
        on:click={() => handleAction("start")}
      >
        {#if loadingAction === "start"}
          <InlineLoading status="active" description={startButtonText} />
        {:else}
          {startButtonText}
        {/if}
      </Button>
    {/if}
  </div>
{:else}
  <ModalFooter class="bx--interstitial-screen__footer" {...$$restProps}>
    {#if showSkip}
      <Button
        kind="ghost"
        disabled={Boolean(loadingAction)}
        on:click={() => handleAction("skip")}
      >
        {skipButtonText}
      </Button>
    {/if}
    {#if showBack}
      <Button
        kind="secondary"
        disabled={Boolean(loadingAction)}
        on:click={() => handleAction("back")}
      >
        {#if loadingAction === "back"}
          <InlineLoading status="active" description={previousButtonText} />
        {:else}
          {previousButtonText}
        {/if}
      </Button>
    {/if}
    {#if showNext}
      <Button
        bind:ref={primaryButtonRef}
        disabled={Boolean(loadingAction)}
        on:click={() => handleAction("next")}
      >
        {#if loadingAction === "next"}
          <InlineLoading status="active" description={nextButtonText} />
        {:else}
          {nextButtonText}
        {/if}
      </Button>
    {/if}
    {#if showStart}
      <Button
        bind:ref={primaryButtonRef}
        icon={isMultiStep ? ArrowRight : undefined}
        disabled={Boolean(loadingAction)}
        on:click={() => handleAction("start")}
      >
        {#if loadingAction === "start"}
          <InlineLoading status="active" description={startButtonText} />
        {:else}
          {startButtonText}
        {/if}
      </Button>
    {/if}
  </ModalFooter>
{/if}
