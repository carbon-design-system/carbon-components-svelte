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
   * @type {string}
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
    sideNavWidth,
  } from "./nav-store.js";

  function handleEscape(event) {
    if (isOpen && !fixed && $isSideNavMobile && event.key === "Escape") {
      isOpen = false;
      $hamburgerMenuRef?.focus();
    }
  }

  const RESIZE_KEYBOARD_STEP = 16;
  const RESIZE_KEYBOARD_LARGE_STEP = 64;
  // Matches the accent line's `transition-delay` (`$duration--moderate-01`)
  // in `_side-nav.scss`.
  // `cursor` can't itself be transitioned, so the same delay is reproduced
  // here in JS to keep the cursor and the highlight in sync.
  const RESIZE_CURSOR_HOVER_DELAY = 150;

  // Rounded: `clientX` is fractional under zoom or on high-DPI displays.
  function clampWidth(value) {
    return Math.round(Math.max(minWidth, Math.min(maxWidth, value)));
  }

  function handleResizePointerDown(event) {
    // Ignore secondary buttons; a right-click opens the context menu, which
    // would swallow the matching `pointerup`.
    if (event.button !== 0) return;
    // Capture routes every later event for this pointer to the handle, even
    // once it leaves the handle, the nav, or (in an iframe) the document.
    event.currentTarget.setPointerCapture?.(event.pointerId);
    resizing = true;
    resizePointerId = event.pointerId;
    resizeStartX = event.clientX;
    resizeStartWidth = renderedWidth;
    clearTimeout(resizeCursorTimer);
    resizeCursorVisible = true;
    // Dragging over page text would otherwise select it as the pointer
    // crosses it; suppress selection for the duration of the drag.
    document.body.classList.add("bx--side-nav-resizing");
  }

  function handleResizePointerMove(event) {
    if (!resizing || event.pointerId !== resizePointerId) return;
    width = clampWidth(resizeStartWidth + (event.clientX - resizeStartX));
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

  function handleResizeKeydown(event) {
    const step = event.shiftKey
      ? RESIZE_KEYBOARD_LARGE_STEP
      : RESIZE_KEYBOARD_STEP;
    let next;
    if (event.key === "ArrowLeft") next = renderedWidth - step;
    else if (event.key === "ArrowRight") next = renderedWidth + step;
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

  function handleResizeHandleMouseEnter() {
    resizeCursorTimer = setTimeout(() => {
      resizeCursorVisible = true;
    }, RESIZE_CURSOR_HOVER_DELAY);
  }

  function handleResizeHandleMouseLeave() {
    clearTimeout(resizeCursorTimer);
    if (!resizing) resizeCursorVisible = false;
  }

  const dispatch = createEventDispatcher();

  let navRef = undefined;
  let winWidth = undefined;
  let prevIsOpen = isOpen;
  // Double-clicking the handle restores the width the side nav started at.
  const initialWidth = width;
  let resizing = false;
  let resizePointerId = undefined;
  let resizeStartX = 0;
  let resizeStartWidth = 0;
  let resizeCursorVisible = false;
  let resizeCursorTimer = undefined;

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
  $: resizeEnabled = resizable && !rail;
  // Inlined rather than `clampWidth(width)` so the bounds are dependencies.
  $: renderedWidth = Math.round(Math.max(minWidth, Math.min(maxWidth, width)));
  $: $sideNavWidth = resizeEnabled ? renderedWidth : undefined;
  // The handle unmounts with `resizeEnabled`, taking its pointer capture
  // (and any `pointerup`) with it; end the drag instead of leaving it on.
  $: if (!resizeEnabled) stopResizing();
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
      clearTimeout(resizeCursorTimer);
      stopResizing();
      sideNavWidth.set(undefined);
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
  class:bx--side-nav--resizable={resizeEnabled}
  class:bx--side-nav--resizing={resizing}
  style:visibility={winWidth !== undefined && !isOpen && !rail
    ? "hidden"
    : undefined}
  style:--ccs-side-nav-width={resizeEnabled ? `${renderedWidth}px` : undefined}
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
      style:cursor={resizing || resizeCursorVisible ? "col-resize" : undefined}
      on:pointerdown={handleResizePointerDown}
      on:pointermove={handleResizePointerMove}
      on:pointerup={endResizing}
      on:pointercancel={endResizing}
      on:lostpointercapture={endResizing}
      on:keydown={handleResizeKeydown}
      on:dblclick={handleResizeDoubleClick}
      on:mouseenter={handleResizeHandleMouseEnter}
      on:mouseleave={handleResizeHandleMouseLeave}
    ></div>
  {/if}
</nav>
