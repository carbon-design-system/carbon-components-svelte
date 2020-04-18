<script>
  export let type = undefined;
  export let icon = undefined;
  export let isOpen = undefined;

  let elRigthPanel = undefined;

  import { cx } from '../../../lib';
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

<div id="right-panel-action-component">
  <button
    aria-label={type}
    class={cx('--header__action', isOpen && '--header__action--active')}
    type="button"
    on:click={() => {
      isOpen = true;
    }}>
    <Icon {...icon} />
  </button>
  {#if isOpen}
    <div
      bind:this={elRigthPanel}
      id="right-panel-action-component-form"
      class={cx('--header-panel', '--header-panel--expanded')}
      transition:slide={{ duration: 200 }}>
      <slot />
    </div>
  {/if}
</div>
