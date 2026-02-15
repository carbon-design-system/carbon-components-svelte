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
   * Specify the ARIA label for the nav.
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
   * - max: 1584.
   */
  export let expansionBreakpoint = 1056;

  import { createEventDispatcher, onMount } from "svelte";
  import {
    isSideNavCollapsed,
    isSideNavMobile,
    isSideNavRail,
    shouldRenderHamburgerMenu,
  } from "./nav-store";

  const dispatch = createEventDispatcher();

  let winWidth = undefined;
  let prevIsOpen = isOpen;

  $: if (prevIsOpen !== isOpen) {
    dispatch(isOpen ? "open" : "close");
    prevIsOpen = isOpen;
  }
  // Only update the collapsed store after hydration (winWidth is known).
  // During SSR, defer to Carbon CSS media queries to handle visibility
  // to avoid a flash when JS sets isOpen after hydration.
  $: if (winWidth !== undefined) {
    $isSideNavCollapsed = !isOpen;
  }
  $: $isSideNavRail = rail;
  $: $isSideNavMobile =
    winWidth !== undefined && winWidth < expansionBreakpoint;

  // Lock body scroll when SideNav is open on mobile (below breakpoint).
  // Only applies to non-fixed, non-rail variants.
  $: if (typeof document !== "undefined") {
    const shouldLockScroll = isOpen && !fixed && !rail && $isSideNavMobile;
    document.body.classList.toggle(
      "bx--body--with-modal-open",
      shouldLockScroll,
    );
  }

  onMount(() => {
    shouldRenderHamburgerMenu.set(true);
    return () => {
      shouldRenderHamburgerMenu.set(false);
      isSideNavMobile.set(false);
      if (typeof document !== "undefined") {
        document.body.classList.remove("bx--body--with-modal-open");
      }
    };
  });
</script>

<svelte:window bind:innerWidth={winWidth} />

{#if !fixed}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    on:click={() => {
      dispatch("click:overlay");
      isOpen = false;
    }}
    class:bx--side-nav__overlay={true}
    class:bx--side-nav__overlay-active={isOpen}
    style:z-index={isOpen ? 6000 : undefined}
  ></div>
{/if}
<nav
  aria-hidden={!isOpen}
  aria-label={ariaLabel}
  class:bx--side-nav__navigation={true}
  class:bx--side-nav={true}
  class:bx--side-nav--ux={true}
  class:bx--side-nav--expanded={rail && winWidth >= expansionBreakpoint
    ? false
    : isOpen}
  class:bx--side-nav--collapsed={winWidth !== undefined && !isOpen && !rail}
  class:bx--side-nav--rail={rail}
  style:visibility={winWidth !== undefined && !isOpen && !rail
    ? "hidden"
    : undefined}
  {...$$restProps}
>
  <slot />
</nav>
