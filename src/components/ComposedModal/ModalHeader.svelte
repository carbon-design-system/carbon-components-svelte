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

  import Close20 from 'carbon-icons-svelte/lib/Close20';
  import { getContext } from 'svelte';
  import { cx } from '../../lib';

  const { closeModal } = getContext('ComposedModal');

  const _class = cx('--modal-header', className);
  const _labelClass = cx('--modal-header__label', '--type-delta', labelClass);
  const _titleClass = cx('--modal-header__heading', '--type-beta', titleClass);
  const _closeClass = cx('--modal-close', closeClass);
  const _closeIconClass = cx('--modal-close__icon', closeIconClass);
</script>

<div class={_class} {style}>
  {#if label}
    <p class={_labelClass}>{label}</p>
  {/if}
  {#if title}
    <p class={_titleClass}>{title}</p>
  {/if}
  <slot />
  <button
    type="button"
    title={iconDescription}
    aria-label={iconDescription}
    class={_closeClass}
    on:click
    on:click={closeModal}>
    <Close20 class={_closeIconClass} />
  </button>
</div>
