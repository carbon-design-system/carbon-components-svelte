<script>
  /**
   * Set to `true` to add a divider between the header
   * navigation items and the side nav items.
   */
  export let hasDivider = false;

  import { getContext, onMount, setContext } from "svelte";
  import { readable } from "svelte/store";
  import { createMenubar } from "../utils/menubar.js";
  import { EXPANSION_BREAKPOINT } from "./expansion-breakpoint.js";
  import { getNavStores } from "./nav-store.js";

  // The same menubar as `HeaderNav`, laid out vertically. Items register
  // through the same context, so `HeaderNavItem` and `HeaderNavMenu` work
  // unchanged.
  const menubar = createMenubar({ orientation: "vertical" });

  /** @type {(node: HTMLElement, submenu?: { isOpen: () => boolean; open: () => void; close: () => void }) => void} */
  const registerItem = menubar.register;
  /** @type {(node: HTMLElement) => void} */
  const unregisterItem = menubar.unregister;
  /** @type {(node: HTMLElement, isCurrent: boolean) => void} */
  const setCurrent = menubar.setCurrent;
  /** @type {import("svelte/store").Readable<HTMLElement | undefined>} */
  const tabStop = menubar.tabStop;
  /** @type {"horizontal" | "vertical"} */
  const orientation = menubar.orientation;

  onMount(() => menubar.destroy);

  setContext("carbon:HeaderNav", {
    registerItem,
    unregisterItem,
    setCurrent,
    tabStop,
    orientation,
  });

  const { expansionBreakpoint, winWidth } = getContext("carbon:SideNav") ?? {
    expansionBreakpoint: readable(EXPANSION_BREAKPOINT),
    winWidth: readable(undefined),
  };

  // A contained shell measures its container, which the `lg` media query
  // can't see, so it always uses the marker classes.
  const { contained } = getNavStores();

  // Only a custom breakpoint (or a container) with a known width needs
  // marker classes. The default path stays pure CSS so server-rendered
  // pages don't shift layout.
  $: custom =
    ($expansionBreakpoint !== EXPANSION_BREAKPOINT || contained) &&
    $winWidth !== undefined;
  $: expanded = custom && $winWidth >= $expansionBreakpoint;
</script>

<!-- Rendered inside `SideNavItems`' list, so it needs its own list item. -->
<li>
  <!-- Holds the same items as `HeaderNav`'s menubar, so it shares its role. -->
  <ul
    role="menubar"
    aria-orientation="vertical"
    class:bx--side-nav__header-navigation={true}
    class:bx--side-nav__header-divider={hasDivider}
    class:bx--side-nav__header-navigation--expanded={custom && expanded}
    class:bx--side-nav__header-navigation--collapsed={custom && !expanded}
    {...$$restProps}
    on:keydown={menubar.handleKeydown}
    on:focusin={menubar.handleFocusin}
  >
    <slot />
  </ul>
</li>
