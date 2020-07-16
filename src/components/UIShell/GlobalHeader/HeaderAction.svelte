<script>
  export let type = undefined;
  export let icon = undefined;
  export let isOpen = undefined;
  export let text = undefined;

  let elRigthPanel = undefined;

  import { cx, optional } from '../../../lib';
  import Icon from '../../Icon/Icon.svelte';
  import { slide } from 'svelte/transition';

  function mouseUp({ target }) {
    if (target && elRigthPanel) {
      if (!elRigthPanel.contains(target)) {
        isOpen = false;
      }
    }
  }
</script>

<svelte:window on:mouseup={mouseUp} />

<div>
  <button
    aria-label={type}
    class={cx('--header__action', isOpen && '--header__action--active', text && '--header__action--text')}
    type="button"
    on:click={() => {
      isOpen = true;
    }}>
    <Icon {...icon} />
    {optional(text)}
  </button>
  {#if isOpen}
    <div
      bind:this={elRigthPanel}
      class={cx('--header-panel', '--header-panel--expanded')}
      transition:slide={{ duration: 200 }}>
      <slot />
    </div>
  {/if}
</div>