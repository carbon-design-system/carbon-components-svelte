<script>
  /**
   * @event {null} open
   * @event {null} close
   * @event {null} click:overlay
   */

  /** Set to `true` to use the fixed variant */
  export let fixed = false;

  /** Set to `true` to use the rail variant */
  export let rail = false;

  /**
   * Specify the ARIA label for the nav
   * @type {string}
   */
  export let ariaLabel = undefined;

  /** Set to `true` to toggle the expanded state */
  export let isOpen = false;

  import { onMount, createEventDispatcher } from "svelte";
  import { shouldRenderHamburgerMenu } from "./navStore";

  const dispatch = createEventDispatcher();

  let winWidth = undefined;
  let railIsOpen = false;

  $: dispatch(isOpen ? "open" : "close");

  onMount(() => {
    shouldRenderHamburgerMenu.set(true);
    return () => shouldRenderHamburgerMenu.set(false);
  });
</script>

<svelte:window bind:innerWidth="{winWidth}" />

{#if !fixed}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div
    on:click="{() => {
      dispatch('click:overlay');
      isOpen = false;
    }}"
    class:bx--side-nav__overlay="{true}"
    class:bx--side-nav__overlay-active="{isOpen}"
    style="{isOpen && 'z-index: 6000'}"
  ></div>
{/if}
<nav
  on:mouseenter="{() => {
    if (rail) railIsOpen = true;
  }}"
  on:mouseleave="{() => {
    if (railIsOpen) railIsOpen = false;
  }}"
  aria-hidden="{!isOpen}"
  aria-label="{ariaLabel}"
  class:bx--side-nav__navigation="{true}"
  class:bx--side-nav="{true}"
  class:bx--side-nav--ux="{true}"
  class:bx--side-nav--expanded="{isOpen || railIsOpen}"
  class:bx--side-nav--collapsed="{!isOpen && !rail}"
  class:bx--side-nav--rail="{rail}"
  {...$$restProps}
>
  <slot />
</nav>
