<script>
  export let type = undefined;
  export let icon = undefined;
  export let content = undefined;
  export let componentIsActive = undefined;

  import { cx } from '../../../lib';
  import Icon from '../../Icon/Icon.svelte';
  import { slide } from 'svelte/transition';
</script>

<style>
  .component-form {
    margin: 1rem;
  }
</style>

<div id="right-panel-action-component">
  <button
    aria-label={type}
    class={cx('--header__action', componentIsActive && '--header__action--active')}
    type="button"
    on:keydown={({ key }) => {
      if (key === 'Enter') {
        componentIsActive = !componentIsActive;
      }
    }}>
    <Icon {...icon[0]} render={icon[0].render} />
  </button>
  {#if componentIsActive}
    <div
      id="right-panel-action-component-form"
      class={cx('--header-panel', '--header-panel--expanded')}
      transition:slide={{ duration: 200 }}>
      <div class="component-form">
        <svelte:component this={content} />
      </div>
    </div>
  {/if}
</div>
