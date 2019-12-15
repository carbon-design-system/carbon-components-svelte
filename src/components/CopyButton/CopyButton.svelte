<script>
  let className = undefined;
  export { className as class };
  export let iconDescription = 'Copy to clipboard';
  export let feedback = 'Copied!';
  export let feedbackTimeout = 2000;
  export let props = {};

  import { createEventDispatcher, onDestroy } from 'svelte';
  import Copy16 from 'carbon-icons-svelte/lib/Copy16';
  import { cx } from '../../lib';

  const dispatch = createEventDispatcher();
  let animation = undefined;
  let timeoutId = undefined;

  onDestroy(() => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
  });

  function handleClick(event) {
    animation = 'fade-in';

    timeoutId = setTimeout(() => {
      animation = 'fade-out';
    }, feedbackTimeout);
  }

  function handleAnimationEnd(event) {
    if (event.animationName === 'hide-feedback') {
      animation = undefined;
    }
  }

  $: _class = cx(
    '--snippet-button', // TODO: deprecated?
    '--copy-btn',
    animation && '--copy-btn--animating',
    animation && `--copy-btn--${animation}`,
    className
  );
</script>

<button
  {...props}
  type="button"
  aria-label={iconDescription}
  title={iconDescription}
  class={_class}
  on:click
  on:click={handleClick}
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:animationend
  on:animationend={handleAnimationEnd}>
  <span class={cx('--assistive-text', '--copy-btn__feedback')}>{feedback}</span>
  <Copy16 class={cx('--snippet__icon')} />
</button>
