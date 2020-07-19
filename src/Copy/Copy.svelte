<script>
  export let feedback = "Copied!";
  export let feedbackTimeout = 2000;
  export let ref = null;

  import { onDestroy } from "svelte";

  $: animation = undefined;
  $: timeoutId = undefined;
  $: showFeedback = timeoutId !== undefined;

  onDestroy(() => {
    window.clearTimeout(timeoutId);
    timeoutId = undefined;
  });
</script>

<button
  bind:this={ref}
  type="button"
  aria-live="polite"
  class:bx--copy={true}
  class:bx--copy-btn--animating={animation}
  aria-label={animation ? feedback : undefined}
  {...$$restProps}
  class="{$$restProps.class}
  {animation && `bx--copy-btn--${animation}`}"
  on:click
  on:click={() => {
    if (animation === 'fade-in') return;
    animation = 'fade-in';
    timeoutId = setTimeout(() => {
      animation = 'fade-out';
    }, feedbackTimeout);
  }}
  on:animationend
  on:animationend={({ animationName }) => {
    if (animationName === 'hide-feedback') {
      animation = undefined;
    }
  }}>
  <slot>
    {#if animation}{feedback || $$restProps['aria-label']}{/if}
  </slot>
  <span
    aria-hidden="true"
    class:bx--assistive-text={true}
    class:bx--copy-btn__feedback={true}>
    {feedback}
  </span>
</button>
