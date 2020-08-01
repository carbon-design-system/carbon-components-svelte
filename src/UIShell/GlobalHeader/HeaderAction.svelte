<script>
  /**
   * Set to `true` to open the panel
   * @type {boolean} [isOpen=false]
   */
  export let isOpen = false;

  /**
   * Specify the icon props
   * @type {{ render: typeof import("carbon-icons-svelte/lib/Add16").default; skeleton: boolean; }} [icon]
   */
  export let icon = undefined;

  /**
   * Specify the text
   * Alternatively, use the named slot "text" (e.g. <div slot="text">...</div>)
   * @type {string} [text]
   */
  export let text = undefined;

  /**
   * Obtain a reference to the button HTML element
   * @type {null | HTMLButtonElement} [ref=null]
   */
  export let ref = null;

  import { Icon } from "../../Icon";
  import { createEventDispatcher } from "svelte";
  import { slide } from "svelte/transition";

  const dispatch = createEventDispatcher();

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

<svelte:body
  on:click={({ target }) => {
    if (isOpen && !ref.contains(target) && !refPanel.contains(target)) {
      isOpen = false;
      dispatch('close');
    }
  }} />

<div>
  <button
    bind:this={ref}
    type="button"
    class:bx--header__action={true}
    class:bx--header__action--active={isOpen}
    class:action-text={text}
    {...$$restProps}
    on:click
    on:click|stopPropagation={() => {
      isOpen = !isOpen;
      dispatch(isOpen ? 'open' : 'close');
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
