<script>
  let className = undefined;
  export { className as class };
  export let iconDescription = 'Copy to clipboard';
  export let feedback = 'Copied!';
  export let feedbackTimeout = 2000;
  export let style = undefined;

  import { onDestroy } from 'svelte';
  import Copy16 from 'carbon-icons-svelte/lib/Copy16';
  import { cx } from '../../lib';

  let animation = undefined;
  let timeoutId = undefined;

  onDestroy(() => {
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
      timeoutId = undefined;
    }
  });

  $: _class = cx(
    '--copy-btn',
    animation && '--copy-btn--animating',
    animation && `--copy-btn--${animation}`,
    animation === 'fade-in' && '--btn--copy__feedback--displayed',
    className
  );
</script>

<button
  type="button"
  tabindex="0"
  aria-label={iconDescription}
  title={iconDescription}
  class={_class}
  on:click
  on:click={() => {
    animation = 'fade-in';
    timeoutId = window.setTimeout(() => {
      animation = 'fade-out';
    }, feedbackTimeout);
  }}
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:animationend
  on:animationend={({ animationName }) => {
    if (animationName === 'hide-feedback') {
      animation = undefined;
    }
  }}
  {style}>
  <span class={cx('--assistive-text', '--copy-btn__feedback')}>{feedback}</span>
  <Copy16 class={cx('--snippet__icon')} />
</button>
