<script>
  /**
   * @restProps {div}
   * @slot {{}} - The shell: `Header`, `SideNav` and `Content`, as at the top of a page.
   */

  /**
   * Specify the container's height, as a CSS length or a number of pixels.
   * The header and side nav fill it, and `Content` scrolls inside it. By
   * default the container grows with its content. Ignored while `expanded`.
   * @type {number | string | undefined}
   */
  export let height = undefined;

  /**
   * Set a Carbon theme for the shell and everything in it, apart from the
   * page's theme: a dark app on a light page, say. Requires `all.css`,
   * which switches themes with CSS custom properties.
   * @type {"white" | "g10" | "g80" | "g90" | "g100" | undefined}
   */
  export let theme = undefined;

  /**
   * Set to `true` to expand the shell to fill the window, and back to
   * `false` to return it to the page. Its state (open nav, scroll, focus)
   * carries over, since it's the same shell.
   * @bindable
   */
  export let expanded = false;

  /**
   * Obtain a reference to the container element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let ref = null;

  import { onMount, setContext } from "svelte";
  import { writable } from "svelte/store";
  import { BREAKPOINT_WIDTH_CONTEXT } from "../Breakpoint/breakpoint-observer.js";
  import {
    acquireBodyScrollLock,
    releaseBodyScrollLock,
  } from "../utils/body-scroll-lock.js";
  import { toCssLength } from "../utils/css-length.js";
  import { observeResize } from "../utils/shared-observer.js";
  import { uniqueId } from "../utils/unique-id.js";
  import { createNavStores, NAV_STORES_CONTEXT } from "./nav-store.js";

  const containerWidth = writable(undefined);

  // Its own nav state, so two shells on a page don't open, collapse or
  // switch to mobile together, and neither touches the page-wide stores.
  /** @type {import("./nav-store.js").NavStores} */
  const navStores = createNavStores(containerWidth, uniqueId("ccs-content-"));
  setContext(NAV_STORES_CONTEXT, navStores);

  // `Breakpoint` and `breakpointObserver` inside the shell report the
  // container's size, not the window's.
  setContext(BREAKPOINT_WIDTH_CONTEXT, containerWidth);

  onMount(() => {
    const unobserve = observeResize(ref, (entry) => {
      // A hidden container (a closed tab) measures 0: keep the last width
      // rather than collapsing its nav for a frame nobody sees.
      if (!entry.contentRect.width) return;
      containerWidth.set(Math.round(entry.contentRect.width));
    });
    return () => {
      unobserve();
      if (holdsBodyLock) releaseBodyScrollLock();
    };
  });

  // The page behind an expanded shell doesn't scroll.
  let holdsBodyLock = false;
  $: if (expanded !== holdsBodyLock) {
    holdsBodyLock = expanded;
    if (expanded) acquireBodyScrollLock();
    else releaseBodyScrollLock();
  }
</script>

<div
  bind:this={ref}
  class:bx--ui-shell-container={true}
  class:bx--ui-shell-container--expanded={expanded}
  {theme}
  style:height={expanded ? undefined : toCssLength(height)}
  {...$$restProps}
>
  <slot />
</div>
