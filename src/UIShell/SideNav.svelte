<script>
  /**
   * @event {null} open
   * @event {null} close
   * @event {null} click:overlay
   * @event {{ width: number }} resize - Fires once the user finishes resizing the side nav (drag release, key press or double click) and the width changed.
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
   * @type {string | undefined}
   */
  export let ariaLabel = undefined;

  /**
   * Set to `true` to toggle the expanded state.
   * @bindable writable
   */
  export let isOpen = false;

  /**
   * The window width (px) at which the SideNav is expanded and the
   * hamburger menu is hidden. Defaults to Carbon's "large" breakpoint
   * (`breakpoints.lg` in `src/Breakpoint/breakpoints.js`).
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

  /**
   * Set to `true` to allow the user to resize the side nav by dragging its
   * edge. Has no effect when `rail` is `true`.
   */
  export let resizable = false;

  /**
   * The side nav's width in pixels, when `resizable` is `true`. Rendered
   * clamped to `[minWidth, maxWidth]`. Ignored otherwise; non-resizable
   * widths stay fixed by CSS per mode (`rail` vs. expanded).
   * @bindable writable
   */
  export let width = 256;

  /** Minimum width in pixels, when `resizable` is `true`. */
  export let minWidth = 200;

  /** Maximum width in pixels, when `resizable` is `true`. */
  export let maxWidth = 480;

  /** Specify the ARIA label for the resize handle. */
  export let resizeHandleLabel = "Resize side navigation";

  /**
   * Specify the delay in milliseconds before hovering the resize handle
   * highlights it and shows the resize cursor.
   * Has no effect unless `resizable` is `true`.
   */
  export let resizeEnterDelayMs = SEPARATOR_HOVER_DELAY_MS;

  /**
   * Specify the delay in milliseconds before the rail expands on hover.
   * Has no effect unless `rail` is `true`.
   */
  export let enterDelayMs = 100;

  /**
   * Specify the delay in milliseconds before the hover-expanded rail
   * collapses once the pointer leaves it.
   * Has no effect unless `rail` is `true`.
   */
  export let leaveDelayMs = 0;

  import {
    createEventDispatcher,
    // biome-ignore lint/style/noRestrictedImports: the only hook the server runs after a render
    onDestroy,
    onMount,
    setContext,
    tick,
  } from "svelte";
  import { writable } from "svelte/store";
  import { SEPARATOR_HOVER_DELAY_MS } from "../constants/timing.js";
  import {
    acquireBodyScrollLock,
    releaseBodyScrollLock,
  } from "../utils/body-scroll-lock.js";
  import { createDelayedSetter } from "../utils/delayed-setter.js";
  import { dismiss } from "../utils/dismiss.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import {
    getLayoutDirection,
    inlineKey,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";
  import { pointerDrag } from "../utils/pointer-drag.js";
  import { scrollIntoViewWithin } from "../utils/scroll-into-view-within.js";
  import { trapFocus } from "../utils/trap-focus.js";
  import { EXPANSION_BREAKPOINT } from "./expansion-breakpoint.js";
  import {
    hamburgerMenuRef,
    isSideNavCollapsed,
    isSideNavMobile,
    isSideNavRail,
    shouldRenderHamburgerMenu,
    sideNavWidth,
  } from "./nav-store.js";

  function handleEscape(event) {
    if (!dismissible || event.key !== "Escape") return;
    // Escape that cancels an IME composition is not a close.
    if (isImeComposition(event)) return;
    // A control inside the nav (a `HeaderNavMenu`) already used this Escape.
    if (event.defaultPrevented) return;
    // Below the breakpoint the open nav traps focus, so any Escape closes
    // it. Above it the nav sits beside the page, so only Escape from the
    // nav or its menu button does.
    if (
      !$isSideNavMobile &&
      !navRef?.contains(event.target) &&
      event.target !== $hamburgerMenuRef
    ) {
      return;
    }
    isOpen = false;
    $hamburgerMenuRef?.focus();
  }

  const RESIZE_KEYBOARD_STEP = 16;
  const RESIZE_KEYBOARD_LARGE_STEP = 64;

  // Rounded: `clientX` is fractional under zoom or on high-DPI displays.
  function clampWidth(value) {
    return Math.round(Math.max(minWidth, Math.min(maxWidth, value)));
  }

  // `pointerDrag` captures the pointer, so the drag follows it past the
  // handle, the nav, or (in an iframe) the document, and ignores secondary
  // buttons and other pointers.
  function handleResizeStart(event) {
    resizing = true;
    resizeStartX = event.clientX;
    // In RTL the handle is on the nav's left edge, so dragging left widens it.
    resizeDirection =
      resolveLayoutDirection($layoutDirection, navRef) === "rtl" ? -1 : 1;
    resizeStartWidth = renderedWidth;
    scheduleResizeHover.cancel();
    resizeHovered = true;
    // Dragging over page text would otherwise select it as the pointer
    // crosses it; suppress selection for the duration of the drag.
    document.body.classList.add("bx--side-nav-resizing");
  }

  function handleResizeMove(event) {
    width = clampWidth(
      resizeStartWidth + resizeDirection * (event.clientX - resizeStartX),
    );
  }

  function stopResizing() {
    if (!resizing) return false;
    resizing = false;
    document.body.classList.remove("bx--side-nav-resizing");
    return true;
  }

  function endResizing() {
    if (stopResizing()) dispatchResize(resizeStartWidth);
  }

  // `bind:width` updates on every step of a drag; `resize` fires once per
  // gesture, e.g. for persisting the final width.
  function dispatchResize(prevWidth) {
    const nextWidth = clampWidth(width);
    if (nextWidth !== prevWidth) dispatch("resize", { width: nextWidth });
  }

  /** @param {KeyboardEvent} event */
  function handleResizeKeydown(event) {
    const step = event.shiftKey
      ? RESIZE_KEYBOARD_LARGE_STEP
      : RESIZE_KEYBOARD_STEP;
    // ArrowRight moves the handle toward the inline end, widening the nav.
    const key = inlineKey(event.key, $layoutDirection, navRef);
    let next;
    if (key === "ArrowLeft") next = renderedWidth - step;
    else if (key === "ArrowRight") next = renderedWidth + step;
    else if (event.key === "Home") next = minWidth;
    else if (event.key === "End") next = maxWidth;
    else return;
    event.preventDefault();
    const prevWidth = renderedWidth;
    width = clampWidth(next);
    dispatchResize(prevWidth);
  }

  function handleResizeDoubleClick() {
    const prevWidth = renderedWidth;
    width = clampWidth(initialWidth);
    dispatchResize(prevWidth);
  }

  // `leaveDelayMs` is for the pointer leaving the rail, not for closing it
  // from the menu button. A transition takes its delay from the style it
  // moves to, and changing the delay later doesn't touch a running one. So
  // drop the delay, flush styles to start the collapse, then restore it.
  async function collapseRailNow() {
    skipRailLeaveDelay = true;
    await tick();
    navRef?.getBoundingClientRect();
    skipRailLeaveDelay = false;
  }

  // Touch has no hover, and a pen or mouse pass over the handle shouldn't
  // flash it.
  /** @param {PointerEvent} event */
  function handleResizeHandlePointerenter(event) {
    if (event.pointerType === "touch") return;
    scheduleResizeHover(resizeEnterDelayMs, () => {
      resizeHovered = true;
    });
  }

  function handleResizeHandlePointerleave() {
    scheduleResizeHover.cancel();
    if (!resizing) resizeHovered = false;
  }

  const dispatch = createEventDispatcher();
  const layoutDirection = getLayoutDirection();

  /** @type {null | HTMLElement} */
  let navRef;
  let winWidth;

  /** @type {import("svelte/store").Writable<number>} */
  const sharedExpansionBreakpoint = writable(expansionBreakpoint);
  /** @type {import("svelte/store").Writable<number | undefined>} */
  const sharedWinWidth = writable(undefined);
  const sharedRail = writable(rail);
  const collapsed = writable(false);

  // `HeaderSideNavItems` reads these to switch at a custom `expansionBreakpoint`.
  // `SideNavMenu` reads the rail state here, so another `SideNav` on the page
  // can't collapse its menus.
  setContext("carbon:SideNav", {
    expansionBreakpoint: sharedExpansionBreakpoint,
    winWidth: sharedWinWidth,
    rail: sharedRail,
    collapsed,
  });

  $: $sharedExpansionBreakpoint = expansionBreakpoint;
  $: $sharedWinWidth = winWidth;
  $: $sharedRail = rail;
  let prevIsOpen = isOpen;
  // Double-clicking the handle restores the width the side nav started at.
  const initialWidth = width;
  let resizing = false;
  let resizeStartX = 0;
  let resizeStartWidth = 0;
  let resizeDirection = 1;
  // Set once the pointer has rested on the handle for `resizeEnterDelayMs`,
  // and for the length of a drag.
  let resizeHovered = false;
  const scheduleResizeHover = createDelayedSetter();
  let skipRailLeaveDelay = false;

  $: if (prevIsOpen !== isOpen) {
    dispatch(isOpen ? "open" : "close");
    if (rail && !isOpen) collapseRailNow();
    prevIsOpen = isOpen;
  }
  // Only update the collapsed store after hydration (winWidth is known).
  // During SSR, defer to Carbon CSS media queries to handle visibility
  // to avoid a flash when JS sets isOpen after hydration.
  $: if (winWidth !== undefined) {
    $collapsed = !isOpen;
    $isSideNavCollapsed = !isOpen;
  }
  $: $isSideNavRail = rail;
  $: resizeEnabled = resizable && !rail;
  // Inlined rather than `clampWidth(width)` so the bounds are dependencies.
  $: renderedWidth = Math.round(Math.max(minWidth, Math.min(maxWidth, width)));
  $: $sideNavWidth = resizeEnabled ? renderedWidth : undefined;
  // The handle unmounts with `resizeEnabled`, taking its pointer capture
  // (and any `pointerup`) with it; end the drag instead of leaving it on.
  $: if (!resizeEnabled) stopResizing();
  $: $isSideNavMobile =
    winWidth !== undefined && winWidth < expansionBreakpoint && !fixed;
  // Escape closes the nav wherever the menu button can reopen it. Above the
  // breakpoint a rail's width follows hover and focus, not `isOpen`, and a
  // nav closed with no menu button would stay hidden.
  $: dismissible =
    isOpen &&
    !fixed &&
    ($isSideNavMobile || (!rail && $hamburgerMenuRef != null));

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
      // Scroll only the nav's own list. `Element.scrollIntoView` also moves
      // Chromium's sequential focus starting point to the item, so the first
      // Tab would skip the skip link and the header.
      if (activeItem instanceof HTMLElement) {
        scrollIntoViewWithin(
          activeItem,
          ".bx--side-nav__items",
          activeItemScrollBlock,
        );
      }
    });
    return () => {
      if (holdsBodyLock) {
        holdsBodyLock = false;
        releaseBodyScrollLock();
      }
      scheduleResizeHover.cancel();
      stopResizing();
    };
  });

  // The server runs this too, once the whole page has rendered. A `Content`
  // after this nav still reads the width, and the next request starts clean.
  onDestroy(() => {
    shouldRenderHamburgerMenu.set(false);
    isSideNavMobile.set(false);
    isSideNavCollapsed.set(false);
    isSideNavRail.set(false);
    sideNavWidth.set(undefined);
  });
</script>

<svelte:window bind:innerWidth={winWidth} />

{#if !fixed}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    on:click={() => {
      dispatch("click:overlay");
      // Only the pointer reaches the overlay, so focus stays put. Moving
      // it to the hamburger would ring it, which Carbon React does not.
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
    enabled: dismissible,
    type: "keydown",
    handler: handleEscape,
  }}
  on:keydown={(event) => {
    if (isOpen && !fixed && $isSideNavMobile && event.key === "Tab") {
      trapFocus({ container: navRef, event });
    }
  }}
  aria-hidden={rail ? undefined : isOpen ? "false" : "true"}
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
  class:bx--side-nav--resizable={resizeEnabled}
  class:bx--side-nav--resizing={resizing}
  style:visibility={winWidth !== undefined && !isOpen && !rail
    ? "hidden"
    : undefined}
  style:--ccs-side-nav-width={resizeEnabled ? `${renderedWidth}px` : undefined}
  style:--ccs-side-nav-rail-enter-delay={rail ? `${enterDelayMs}ms` : undefined}
  style:--ccs-side-nav-rail-leave-delay={rail && !skipRailLeaveDelay
    ? `${leaveDelayMs}ms`
    : undefined}
  {...$$restProps}
>
  <slot />
  {#if resizeEnabled}
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <div
      role="separator"
      aria-orientation="vertical"
      aria-valuenow={renderedWidth}
      aria-valuemin={minWidth}
      aria-valuemax={maxWidth}
      aria-label={resizeHandleLabel}
      tabindex="0"
      class:bx--side-nav__resize-handle={true}
      class:bx--side-nav__resize-handle--hover={resizeHovered}
      use:pointerDrag={{
        onStart: handleResizeStart,
        onMove: handleResizeMove,
        onEnd: endResizing,
      }}
      on:keydown={handleResizeKeydown}
      on:dblclick={handleResizeDoubleClick}
      on:pointerenter={handleResizeHandlePointerenter}
      on:pointerleave={handleResizeHandlePointerleave}
    ></div>
  {/if}
</nav>
