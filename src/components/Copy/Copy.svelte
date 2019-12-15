<script>
  let className = undefined;
  export { className as class };
  export let feedback = 'Copied!';
  export let feedbackTimeout = 2000;
  export let props = {};

  import { createEventDispatcher, onDestroy } from 'svelte';
  import { cx } from '../../lib';

  const dispatch = createEventDispatcher();

  let timeoutId = undefined;
  let showFeedback = false;

  function handleClick(event) {
    showFeedback = true;

    timeoutId = setTimeout(() => {
      showFeedback = false;
    }, feedbackTimeout);
  }

  onDestroy(() => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
  });

  $: _class = cx('--btn--copy__feedback', showFeedback && '--btn--copy__feedback--displayed');
</script>

<button
  {...props}
  type="button"
  class={className}
  on:click
  on:click={handleClick}
  on:mouseover
  on:mouseenter
  on:mouseleave>
  <slot />
  <div class={_class} data-feedback={feedback} />
</button>
