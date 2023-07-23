<script>
  /**
   * @event {null} open
   * @event {null} close
   */

  /** Set to `true` to open the panel */
  export let isOpen = false;

  /**
   * Specify the icon to render when the action panel is closed.
   * Defaults to `<Switcher size={20} />`
   * @type {typeof import("svelte").SvelteComponent<any>}
   */
  export let icon = Switcher;

  /**
   * Specify the icon to render when the action panel is open.
   * Defaults to `<Close size={20} />`
   * @type {typeof import("svelte").SvelteComponent<any>}
   */
  export let closeIcon = Close;

  /**
   * Specify the text.
   * Alternatively, use the named slot "text" (e.g., `<div slot="text">...</div>`)
   * @type {string}
   */
  export let text = undefined;

  /** Obtain a reference to the button HTML element */
  export let ref = null;

  /**
   * Customize the panel transition (i.e., `transition:slide`).
   * Set to `false` to disable the transition
   * @type {false | import("svelte/transition").SlideParams}
   */
  export let transition = { duration: 200 };

  /** Set to `true` to prevent the panel from closing when clicking outside */
  export let preventCloseOnClickOutside = false;

  import { createEventDispatcher } from "svelte";
  import { slide } from "svelte/transition";
  import Close from "../icons/Close.svelte";
  import Switcher from "../icons/Switcher.svelte";

  const dispatch = createEventDispatcher();

  let refPanel = null;
</script>

<svelte:window
  on:click="{({ target }) => {
    if (
      isOpen &&
      !ref.contains(target) &&
      !refPanel.contains(target) &&
      !preventCloseOnClickOutside
    ) {
      isOpen = false;
      dispatch('close');
    }
  }}"
/>

<button
  bind:this="{ref}"
  type="button"
  class:bx--header__action="{true}"
  class:bx--header__action--active="{isOpen}"
  class:action-text="{text}"
  {...$$restProps}
  on:click
  on:click|stopPropagation="{() => {
    isOpen = !isOpen;
    dispatch(isOpen ? 'open' : 'close');
  }}"
>
  {#if isOpen}
    <slot name="closeIcon">
      <svelte:component this="{closeIcon}" size="{20}" />
    </slot>
  {:else}
    <slot name="icon">
      <svelte:component this="{icon}" size="{20}" />
    </slot>
  {/if}
  <slot name="text">
    {#if text}<span>{text}</span>{/if}
  </slot>
</button>
{#if isOpen}
  <div
    bind:this="{refPanel}"
    class:bx--header-panel="{true}"
    class:bx--header-panel--expanded="{true}"
    transition:slide|local="{{
      ...transition,
      duration: transition === false ? 0 : transition.duration,
    }}"
  >
    <slot />
  </div>
{/if}

<style>
  .action-text {
    display: inline-flex;
    align-items: center;
    width: auto;

    /** 2px bottom padding aligns icon with `HeaderAction` */
    padding: 0 1rem 2px 1rem;

    /** `body-short-01` styles */
    font-size: 0.875rem;
    line-height: 1.28572;
    letter-spacing: 0.16px;

    /** Same color as `Header` platformName */
    color: #f4f4f4;
  }

  .action-text > span {
    margin-left: 0.75rem;
  }
</style>
