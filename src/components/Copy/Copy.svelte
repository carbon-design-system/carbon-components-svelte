<script>
  let className = undefined;
  export { className as class };
  export let feedback = 'Copied!';
  export let feedbackTimeout = 2000;
  export let style = undefined;

  import { onDestroy } from 'svelte';
  import { cx } from '../../lib';

  let timeoutId = undefined;

  onDestroy(() => {
    window.clearTimeout(timeoutId);
    timeoutId = undefined;
  });

  $: showFeedback = timeoutId !== undefined;
</script>

<button
  type="button"
  class={className}
  on:click
  on:click={() => {
    timeoutId = window.setTimeout(() => {
      showFeedback = undefined;
    }, feedbackTimeout);
  }}
  on:mouseover
  on:mouseenter
  on:mouseleave
  {style}>
  <slot />
  <div
    class={cx('--btn--copy__feedback', showFeedback && '--btn--copy__feedback--displayed')}
    data-feedback={feedback} />
</button>
