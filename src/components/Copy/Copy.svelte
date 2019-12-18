<script>
  let className = undefined;
  export { className as class };
  export let feedback = 'Copied!';
  export let feedbackTimeout = 2000;

  import { onDestroy } from 'svelte';
  import { cx } from '../../lib';

  let timeoutId = undefined;
  let showFeedback = false;

  onDestroy(() => {
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
      timeoutId = undefined;
    }
  });

  $: _class = cx('--btn--copy__feedback', showFeedback && '--btn--copy__feedback--displayed');
</script>

<button
  type="button"
  class={className}
  on:click
  on:click={() => {
    showFeedback = true;
    timeoutId = window.setTimeout(() => {
      showFeedback = false;
    }, feedbackTimeout);
  }}
  on:mouseover
  on:mouseenter
  on:mouseleave>
  <slot />
  <div class={_class} data-feedback={feedback} />
</button>
