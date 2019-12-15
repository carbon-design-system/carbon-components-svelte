<script>
  let className = undefined;
  export { className as class };
  export let success = false; // TODO: deprecate
  export let status = success ? 'finished' : 'active';
  export let description = undefined;
  export let iconDescription = undefined;
  export let successDelay = 1500;
  export let props = {};

  import { createEventDispatcher, onDestroy } from 'svelte';
  import CheckmarkFilled16 from 'carbon-icons-svelte/lib/CheckmarkFilled16';
  import Error20 from 'carbon-icons-svelte/lib/Error20';
  import { cx } from '../../lib';
  import Loading from '../Loading';

  const dispatch = createEventDispatcher();
  const _class = cx('--inline-loading', className);
  let timeoutId = undefined;

  onDestroy(() => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
  });

  $: if (status === 'finished') {
    timeoutId = setTimeout(() => {
      dispatch('success');
    }, successDelay);
  }
</script>

<div {...props} class={_class} aria-live={$$props['aria-live'] || 'assertive'}>
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
