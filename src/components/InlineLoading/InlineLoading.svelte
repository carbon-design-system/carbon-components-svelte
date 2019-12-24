<script>
  let className = undefined;
  export { className as class };
  export let status = 'active';
  export let description = undefined;
  export let iconDescription = undefined;
  export let successDelay = 1500;
  export let style = undefined;

  import { createEventDispatcher, onDestroy } from 'svelte';
  import CheckmarkFilled16 from 'carbon-icons-svelte/lib/CheckmarkFilled16';
  import Error20 from 'carbon-icons-svelte/lib/Error20';
  import { cx } from '../../lib';
  import Loading from '../Loading';

  const dispatch = createEventDispatcher();

  let timeoutId = undefined;

  onDestroy(() => {
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
      timeoutId = undefined;
    }
  });

  $: if (status === 'finished') {
    timeoutId = window.setTimeout(() => {
      dispatch('success');
    }, successDelay);
  }
</script>

<div
  aria-live={$$props['aria-live'] || 'assertive'}
  class={cx('--inline-loading', className)}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  {style}>
  <div class={cx('--inline-loading__animation')}>
    {#if status === 'error'}
      <Error20 class={cx('--inline-loading--error')} />
    {:else if status === 'finished'}
      <CheckmarkFilled16 class={cx('--inline-loading__checkmark-container')} />
    {:else if status === 'inactive' || status === 'active'}
      <Loading
        small
        description={iconDescription}
        withOverlay={false}
        active={status === 'active'} />
    {/if}
  </div>
  {#if description}
    <div class={cx('--inline-loading__text')}>{description}</div>
  {/if}
</div>
