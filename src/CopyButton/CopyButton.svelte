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

  import { createEventDispatcher, onMount } from "svelte";
  import Copy from "../icons/Copy.svelte";
  import FloatingPortal from "../Portal/FloatingPortal.svelte";

  let buttonRef = null;

  const dispatch = createEventDispatcher();

  /** @type {"fade-in" | "fade-out"} */
  let animation = undefined;
  let timeout = undefined;

  onMount(() => {
    return () => clearTimeout(timeout);
  });
</script>

<button
  bind:this={buttonRef}
  type="button"
  aria-live="polite"
  class:bx--copy-btn={true}
  class:bx--copy={true}
  class:bx--copy-btn--animating={animation}
  class:bx--copy-btn--portal={true}
  class:bx--copy-btn--fade-in={animation === "fade-in"}
  class:bx--copy-btn--fade-out={animation === "fade-out"}
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
    timeout = setTimeout(() => {
      animation = "fade-out";
    }, feedbackTimeout);
  }}
  on:animationend
  on:animationend={({ animationName }) => {
    if (animationName === "hide-feedback") {
      animation = undefined;
    }
  }}
>
  <Copy class="bx--snippet__icon" />
</button>

<FloatingPortal anchor={buttonRef} direction="bottom" open={!!animation}>
  <div
    class:bx--copy-btn={true}
    class:bx--copy-btn--animating={animation}
    class:bx--copy-btn--fade-in={animation === "fade-in"}
    class:bx--copy-btn--fade-out={animation === "fade-out"}
    style="position: relative; display: block; width: 100%; height: 0; padding: 0; border: none; background: none;"
  >
    <span
      aria-hidden="true"
      class:bx--assistive-text={true}
      class:bx--copy-btn__feedback={true}
      style="top: 0.75rem; bottom: auto; transform: translateX(-50%);"
    >
      {feedback}
    </span>
  </div>
</FloatingPortal>
