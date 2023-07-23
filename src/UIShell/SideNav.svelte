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

  /**
   * The window width (px) at which the SideNav is expanded and the hamburger menu is hidden.
   * 1056 represents the "large" breakpoint in pixels from the Carbon Design System:
   * - small: 320
   * - medium: 672
   * - large: 1056
   * - x-large: 1312
   * - max: 1584
   */
  export let expansionBreakpoint = 1056;

  import { onMount, createEventDispatcher } from "svelte";
  import {
    shouldRenderHamburgerMenu,
    isSideNavCollapsed,
    isSideNavRail,
  } from "./navStore";

  const dispatch = createEventDispatcher();

  let winWidth = undefined;

  $: dispatch(isOpen ? "open" : "close");
  $: $isSideNavCollapsed = !isOpen;
  $: $isSideNavRail = rail;

  onMount(() => {
    shouldRenderHamburgerMenu.set(true);
    return () => shouldRenderHamburgerMenu.set(false);
  });
</script>

<svelte:window bind:innerWidth="{winWidth}" />

{#if !fixed}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    on:click="{() => {
      dispatch('click:overlay');
      isOpen = false;
    }}"
    class:bx--side-nav__overlay="{true}"
    class:bx--side-nav__overlay-active="{isOpen}"
    style:z-index="{isOpen ? 6000 : undefined}"
  ></div>
{/if}
<nav
  aria-hidden="{!isOpen}"
  aria-label="{ariaLabel}"
  class:bx--side-nav__navigation="{true}"
  class:bx--side-nav="{true}"
  class:bx--side-nav--ux="{true}"
  class:bx--side-nav--expanded="{rail && winWidth >= expansionBreakpoint
    ? false
    : isOpen}"
  class:bx--side-nav--collapsed="{!isOpen && !rail}"
  class:bx--side-nav--rail="{rail}"
  {...$$restProps}
>
  <slot />
</nav>
