<script>
  /** Set the feedback text shown after clicking the button */
  export let feedback = "Copied!";

  /** Set the timeout duration (ms) to display feedback text */
  export let feedbackTimeout = 2000;

  /** Obtain a reference to the button HTML element */
  export let ref = null;

  import { onMount } from "svelte";

  let animation = undefined;
  let timeout = undefined;

  onMount(() => {
    return () => {
      clearTimeout(timeout);
    };
  });
</script>

<button
  bind:this="{ref}"
  type="button"
  aria-live="polite"
  class:bx--copy="{true}"
  class:bx--copy-btn--animating="{animation}"
  aria-label="{animation ? feedback : undefined}"
  {...$$restProps}
  class="{$$restProps.class} {animation && `bx--copy-btn--${animation}`}"
  on:click
  on:click="{() => {
    if (animation === 'fade-in') return;
    animation = 'fade-in';
    timeout = setTimeout(() => {
      animation = 'fade-out';
    }, feedbackTimeout);
  }}"
  on:animationend
  on:animationend="{({ animationName }) => {
    if (animationName === 'hide-feedback') {
      animation = undefined;
    }
  }}"
>
  <slot>
    {#if animation}{feedback || $$restProps["aria-label"]}{/if}
  </slot>
  <span
    aria-hidden="true"
    class:bx--assistive-text="{true}"
    class:bx--copy-btn__feedback="{true}"
  >
    {feedback}
  </span>
</button>
