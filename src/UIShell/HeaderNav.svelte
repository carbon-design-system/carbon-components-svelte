<script>
  import { getContext, onMount, setContext } from "svelte";
  import { readable } from "svelte/store";
  import { createMenubar } from "../utils/menubar.js";
  import { EXPANSION_BREAKPOINT } from "./expansion-breakpoint.js";
  import { getNavStores } from "./nav-store.js";

  // Top-level items register here so the bar is a single Tab stop that the
  // arrow keys rove through.
  const menubar = createMenubar();
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

  const { expansionBreakpoint, winWidth } = getContext("carbon:Header") ?? {
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

<nav
  class:bx--header__nav={true}
  class:bx--header__nav--expanded={custom && expanded}
  class:bx--header__nav--collapsed={custom && !expanded}
  {...$$restProps}
>
  <ul
    role="menubar"
    class:bx--header__menu-bar={true}
    on:keydown={menubar.handleKeydown}
    on:focusin={menubar.handleFocusin}
  >
    <slot />
  </ul>
</nav>
