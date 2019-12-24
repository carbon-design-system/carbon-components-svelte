<script>
  let className = undefined;
  export { className as class };
  export let labelClass = undefined;
  export let titleClass = undefined;
  export let closeClass = undefined;
  export let closeIconClass = undefined;
  export let label = undefined;
  export let title = '';
  export let iconDescription = 'Close';
  export let style = undefined;

  import { getContext } from 'svelte';
  import Close20 from 'carbon-icons-svelte/lib/Close20';
  import { cx } from '../../lib';

  const { closeModal } = getContext('ComposedModal');
</script>

<div class={cx('--modal-header', className)} {style}>
  {#if label}
    <p class={cx('--modal-header__label', '--type-delta', labelClass)}>{label}</p>
  {/if}
  {#if title}
    <p class={cx('--modal-header__heading', '--type-beta', titleClass)}>{title}</p>
  {/if}
  <slot />
  <button
    type="button"
    title={iconDescription}
    aria-label={iconDescription}
    class={cx('--modal-close', closeClass)}
    on:click
    on:click={closeModal}>
    <Close20 class={cx('--modal-close__icon', closeIconClass)} />
  </button>
</div>
