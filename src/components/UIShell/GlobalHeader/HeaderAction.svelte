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

<style>
    .action-text {
        font-size: 16px;
        line-height: 20px;
        text-decoration: none;
        color: #fff;
        width: 100%;
        padding: 0 1rem;
    }

    .action-text > span {
        margin-left: 0.75rem;
        vertical-align: top;
    }
</style>

<svelte:window on:mouseup={mouseUp} />

<div>
  <button
    aria-label={type}
    class={cx('--header__action', isOpen && '--header__action--active')}
    class:action-text={text}
    type="button"
    on:click={() => {
      isOpen = true;
    }}>
    <Icon {...icon} />
    <slot name="custom-el">
      {#if text}
        <span>{text}</span>
      {/if}
    </slot>
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