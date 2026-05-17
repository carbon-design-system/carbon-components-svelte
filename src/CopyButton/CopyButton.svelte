<script>
  /**
   * @template [Icon=any]
   */

  /** Set the feedback text shown after clicking the button */
  export let feedback = "Copied!";

  /** Set the timeout duration (ms) to display feedback text */
  export let feedbackTimeout = 2000;

  /**
   * Specify an icon to render during the feedback window (e.g. after copying).
   * When unset, the copy icon is always shown.
   * @type {Icon}
   */
  export let feedbackIcon = /** @type {Icon} */ (undefined);

  /** Set the title and ARIA label for the copy button */
  export let iconDescription = "Copy to clipboard";

  /**
   * Specify the text to copy.
   * @type {string}
   */
  export let text = undefined;

  /**
   * Override the default copy behavior (navigator.clipboard.writeText).
   * @type {(text: string) => void | Promise<void>}
   */
  const defaultCopy = async (text) => {
    await navigator.clipboard.writeText(text);
  };

  export let copy = defaultCopy;

  /**
   * Set to `true` to render the feedback tooltip in a portal,
   * preventing it from being clipped by `overflow: hidden` containers.
   * By default, the tooltip is portalled when inside a `Modal`.
   * @type {boolean | undefined}
   */
  export let portalTooltip = undefined;

  /** Obtain a reference to the underlying button element. */
  export let ref = null;

  import { createEventDispatcher, getContext, onMount } from "svelte";
  import Copy from "../icons/Copy.svelte";
  import PortalTooltip from "../Portal/PortalTooltip.svelte";
  import { observeModalClose } from "../Portal/portal-utils.js";
  import { createCopyFeedbackState } from "../utils/copyFeedback.js";

  const dispatch = createEventDispatcher();
  const insideModal = getContext("carbon:Modal");

  $: effectivePortalTooltip =
    portalTooltip === undefined ? !!insideModal : portalTooltip;

  const copyFeedback = createCopyFeedbackState(syncCopyFeedback);

  /** @type {"fade-in" | "fade-out"} */
  let animation = undefined;
  let feedbackOpen = false;
  let copyPending = false;

  function syncCopyFeedback() {
    animation = copyFeedback.animation;
    feedbackOpen = copyFeedback.feedbackOpen;
    copyPending = copyFeedback.copyPending;
  }

  function dismissFeedback() {
    copyFeedback.dismiss();
  }

  let disconnectModalObserver = () => {};

  $: {
    disconnectModalObserver();
    disconnectModalObserver =
      effectivePortalTooltip && ref
        ? observeModalClose(ref, dismissFeedback)
        : () => {};
  }

  onMount(() => {
    return () => {
      copyFeedback.cleanup();
      disconnectModalObserver();
    };
  });
</script>

<button
  bind:this={ref}
  type="button"
  aria-live="polite"
  aria-busy={copyPending || undefined}
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
  on:click={async () => {
    try {
      await copyFeedback.onClick(async () => {
        if (copy === defaultCopy ? text !== undefined : true) {
          await copy(text ?? "");
          dispatch("copy");
        }
      }, feedbackTimeout);
    } catch (error) {
      dispatch("copy:error", { error });
    }
  }}
  on:animationend
  on:animationend={(event) => {
    copyFeedback.onAnimationEnd(event);
  }}
  on:mouseenter
  on:mouseleave
  on:focus
  on:blur
>
  {#if feedbackIcon && feedbackOpen}
    <svelte:component this={feedbackIcon} class="bx--snippet__icon" />
  {:else}
    <Copy class="bx--snippet__icon" />
  {/if}
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
  <PortalTooltip anchor={ref} open={feedbackOpen} text={feedback} />
{/if}
