<script>
  export let type = undefined;
  export let icon = undefined;
  export let componentIsActive = undefined;

  let elRigthPanel = undefined;

  import { cx } from '../../../lib';
  import Icon from '../../Icon/Icon.svelte';
  import { slide } from 'svelte/transition';

  function mouseUp({ target }) {
    if (target && elRigthPanel) {
      if (!elRigthPanel.contains(target)) {
        componentIsActive = false;
      }
    }
  }
</script>

<style>
  .component-form {
    margin: 1rem;
  }
</style>

<svelte:window on:mouseup={mouseUp} />

<div id="right-panel-action-component">
  <button
    aria-label={type}
    class={cx('--header__action', componentIsActive && '--header__action--active')}
    type="button"
    on:click={() => {
      componentIsActive = true;
    }}>
    <Icon {...icon} />
  </button>
  {#if componentIsActive}
    <div
      bind:this={elRigthPanel}
      id="right-panel-action-component-form"
      class={cx('--header-panel', '--header-panel--expanded')}
      transition:slide={{ duration: 200 }}>
      <div class="component-form">
        <slot />
      </div>
    </div>
  {/if}
</div>
