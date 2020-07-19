<script>
  export let type = undefined;
  export let icon = undefined;
  export let isOpen = undefined;
  export let text = undefined;

  import { Icon } from "../../Icon";
  import { slide } from "svelte/transition";

  let refPanel = null;
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

<svelte:window
  on:mouseup={({ target }) => {
    if (target && refPanel) {
      if (!refPanel.contains(target)) {
        isOpen = false;
      }
    }
  }} />

<div>
  <button
    type="button"
    aria-label={type}
    class:bx--header__action={true}
    class:bx--header__action--active={isOpen}
    class:action-text={text}
    {...$$restProps}
    on:click
    on:click={() => {
      isOpen = true;
    }}>
    <Icon {...icon} />
    <slot name="text">
      {#if text}
        <span>{text}</span>
      {/if}
    </slot>
  </button>
  {#if isOpen}
    <div
      bind:this={refPanel}
      class:bx--header-panel={true}
      class:bx--header-panel--expanded={true}
      transition:slide={{ duration: 200 }}>
      <slot />
    </div>
  {/if}
</div>
