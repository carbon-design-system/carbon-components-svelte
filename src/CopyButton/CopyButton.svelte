<script>
  /** Set the feedback text shown after clicking the button */
  export let feedback = "Copied!";

  /** Set the timeout duration (ms) to display feedback text */
  export let feedbackTimeout = 2000;

  /** Set the title and ARIA label for the copy button */
  export let iconDescription = "Copy to clipboard";

  /**
   * Specify the text to copy.
   * @type {string}
   */
  export let text;

  /**
   * Override the default copy behavior of using the navigator.clipboard.writeText API to copy text.
   * @type {(text: string) => void}
   */
  export let copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.log(e);
    }
  };

  /**
   * Set to `true` to render the feedback tooltip in a portal,
   * preventing it from being clipped by `overflow: hidden` containers.
   * By default, the tooltip is portalled when inside a `Modal`.
   * @type {boolean | undefined}
   */
  export let portalTooltip = undefined;

  import { createEventDispatcher, getContext, onMount } from "svelte";
  import Copy from "../icons/Copy.svelte";
  import PortalTooltip from "../Portal/PortalTooltip.svelte";
  import { observeModalClose } from "../Portal/portal-utils.js";

  const dispatch = createEventDispatcher();
  const insideModal = getContext("carbon:Modal");

  $: effectivePortalTooltip =
    portalTooltip === undefined ? !!insideModal : portalTooltip;

  /** @type {null | HTMLButtonElement} */
  let buttonRef = null;

  /** @type {"fade-in" | "fade-out"} */
  let animation = undefined;
  let timeout = undefined;
  let feedbackOpen = false;

  function dismissFeedback() {
    feedbackOpen = false;
    animation = undefined;
    clearTimeout(timeout);
  }

  onMount(() => {
    const disconnectModalObserver =
      effectivePortalTooltip && buttonRef
        ? observeModalClose(buttonRef, dismissFeedback)
        : () => {};

    return () => {
      clearTimeout(timeout);
      feedbackOpen = false;
      disconnectModalObserver();
    };
  });
</script>

<button
  bind:this={buttonRef}
  type="button"
  aria-live="polite"
  class:bx--copy-btn={true}
  class:bx--copy={true}
  class:bx--copy-btn--animating={animation}
  class:bx--copy-btn--fade-in={animation === "fade-in"}
  class:bx--copy-btn--fade-out={animation === "fade-out"}
  class:bx--copy-btn--portal-active={effectivePortalTooltip}
  aria-label={iconDescription}
  title={iconDescription}
  {...$$restProps}
  on:click
  on:click={() => {
    if (text !== undefined) {
      copy(text);
      dispatch("copy");
    }

    if (animation === "fade-in") return;
    animation = "fade-in";
    feedbackOpen = true;
    timeout = setTimeout(() => {
      animation = "fade-out";
    }, feedbackTimeout);
  }}
  on:animationend
  on:animationend={({ animationName }) => {
    if (animationName === "hide-feedback") {
      animation = undefined;
      feedbackOpen = false;
    }
  }}
>
  <Copy class="bx--snippet__icon" />
  {#if !effectivePortalTooltip}
    <span
      aria-hidden="true"
      class:bx--assistive-text={true}
      class:bx--copy-btn__feedback={true}
    >
      {feedback}
    </span>
  {/if}
</button>

{#if effectivePortalTooltip}
  <PortalTooltip anchor={buttonRef} open={feedbackOpen} text={feedback} />
{/if}
