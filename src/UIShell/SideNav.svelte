<script>
  /**
   * @event {null} open
   * @event {null} close
   * @event {null} click:overlay
   */

  /** Set to `true` to use the fixed variant */
  export let fixed = false;

  /**
   * Set to `true` to use the rail variant.
   * @bindable writable
   */
  export let rail = false;

  /**
   * Specify the ARIA label for the nav.
   * @type {string}
   */
  export let ariaLabel = undefined;

  /**
   * Set to `true` to toggle the expanded state.
   * @bindable writable
   */
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
  export let expansionBreakpoint = EXPANSION_BREAKPOINT;

  /**
   * Set to `"classic"` for the mixed UI Shell theme (White side nav).
   * Use with `Header` `theme="classic"` (Gray 100 header).
   * Requires `carbon-components-svelte/css/all.css`.
   * @type {"classic" | undefined}
   */
  export let theme = undefined;

  /**
   * Set to `true` to render a border between the side nav and its content.
   * Useful when the side nav and content share the same background and
   * otherwise blend together.
   */
  export let border = false;

  /**
   * Specify the scroll alignment used to bring the active item into view on mount.
   * Defaults to `"nearest"`, which only scrolls when the active item is out of view.
   * @type {"start" | "center" | "end" | "nearest"}
   */
  export let activeItemScrollBlock = "nearest";

  import { createEventDispatcher, onMount, tick } from "svelte";
  import {
    acquireBodyScrollLock,
    releaseBodyScrollLock,
  } from "../utils/body-scroll-lock.js";
  import { dismiss } from "../utils/dismiss.js";
  import { trapFocus } from "../utils/trap-focus.js";
  import { EXPANSION_BREAKPOINT } from "./expansion-breakpoint.js";
  import {
    hamburgerMenuRef,
    isSideNavCollapsed,
    isSideNavMobile,
    isSideNavRail,
    shouldRenderHamburgerMenu,
  } from "./nav-store.js";

  function handleEscape(event) {
    if (isOpen && !fixed && $isSideNavMobile && event.key === "Escape") {
      isOpen = false;
      $hamburgerMenuRef?.focus();
    }
  }

  const dispatch = createEventDispatcher();

  let navRef = undefined;
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
    winWidth !== undefined && winWidth < expansionBreakpoint && !fixed;

  // Lock body scroll when SideNav is open on mobile (below breakpoint).
  // Only applies to non-fixed, non-rail variants. Uses the shared ref-counted
  // lock so a Modal opened concurrently is not affected by this toggle.
  let holdsBodyLock = false;
  $: {
    const shouldLockScroll = isOpen && !fixed && !rail && $isSideNavMobile;
    if (shouldLockScroll && !holdsBodyLock) {
      holdsBodyLock = true;
      acquireBodyScrollLock();
    } else if (!shouldLockScroll && holdsBodyLock) {
      holdsBodyLock = false;
      releaseBodyScrollLock();
    }
  }

  onMount(() => {
    shouldRenderHamburgerMenu.set(!fixed);
    tick().then(() => {
      const activeItem = navRef?.querySelector('[aria-current="page"]');
      activeItem?.scrollIntoView({ block: activeItemScrollBlock });
    });
    return () => {
      shouldRenderHamburgerMenu.set(false);
      isSideNavMobile.set(false);
      if (holdsBodyLock) {
        holdsBodyLock = false;
        releaseBodyScrollLock();
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
    class:bx--side-nav__overlay--mobile={$isSideNavMobile}
    class:bx--side-nav__overlay-active={isOpen}
  ></div>
{/if}
<nav
  bind:this={navRef}
  use:dismiss={{
    enabled: isOpen && !fixed && $isSideNavMobile,
    type: "keydown",
    handler: handleEscape,
  }}
  on:keydown={(event) => {
    if (isOpen && !fixed && $isSideNavMobile && event.key === "Tab") {
      trapFocus({ container: navRef, event });
    }
  }}
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
  class:bx--side-nav--fixed={fixed}
  class:bx--side-nav--ui-shell-classic={theme === "classic"}
  class:bx--side-nav--border={border}
  style:visibility={winWidth !== undefined && !isOpen && !rail
    ? "hidden"
    : undefined}
  {...$$restProps}
>
  <slot />
</nav>
