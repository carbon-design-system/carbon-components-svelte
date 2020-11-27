<script>
  /**
   * @typedef {{ delay?: number; duration?: number; easing?: (t: number) => number; }} HeaderActionSlideTransition
   */

  /** Set to `true` to open the panel */
  export let isOpen = false;

  /**
   * Specify the icon props
   * @type {{ render: import("carbon-icons-svelte").CarbonIcon; skeleton: boolean; }}
   */
  export let icon = undefined;

  /**
   * Specify the text
   * Alternatively, use the named slot "text" (e.g., <div slot="text">...</div>)
   * @type {string}
   */
  export let text = undefined;

  /** Obtain a reference to the button HTML element */
  export let ref = null;

  /**
   * Customize the panel transition (i.e., `transition:slide`)
   * Set to `false` to disable the transition
   * @type {false | HeaderActionSlideTransition}
   */
  export let transition = { duration: 200 };

  import { createEventDispatcher } from "svelte";
  import { slide } from "svelte/transition";
  import Close20 from "carbon-icons-svelte/lib/Close20";
  import AppSwitcher20 from "carbon-icons-svelte/lib/AppSwitcher20";
  import { Icon } from "../../Icon";

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

<svelte:window
  on:click="{({ target }) => {
    if (isOpen && !ref.contains(target) && !refPanel.contains(target)) {
      isOpen = false;
      dispatch('close');
    }
  }}"
/>

<div>
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
    <Icon render="{isOpen ? Close20 : AppSwitcher20}" {...icon} />
    <slot name="text">
      {#if text}<span>{text}</span>{/if}
    </slot>
  </button>
  {#if isOpen}
    <div
      bind:this="{refPanel}"
      class:bx--header-panel="{true}"
      class:bx--header-panel--expanded="{true}"
      transition:slide="{{ ...transition, duration: transition === false ? 0 : transition.duration }}"
    >
      <slot />
    </div>
  {/if}
</div>
