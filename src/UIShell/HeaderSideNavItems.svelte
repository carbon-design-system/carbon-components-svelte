<script>
  /**
   * Set to `true` to add a divider between the header
   * navigation items and the side nav items.
   */
  export let hasDivider = false;

  import { getContext } from "svelte";
  import { readable } from "svelte/store";
  import { EXPANSION_BREAKPOINT } from "./expansion-breakpoint.js";

  const { expansionBreakpoint, winWidth } = getContext("carbon:SideNav") ?? {
    expansionBreakpoint: readable(EXPANSION_BREAKPOINT),
    winWidth: readable(undefined),
  };

  // Only a custom breakpoint with a known width needs marker classes. The
  // default path stays pure CSS so server-rendered pages don't shift layout.
  $: custom =
    $expansionBreakpoint !== EXPANSION_BREAKPOINT && $winWidth !== undefined;
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
  >
    <slot />
  </ul>
</li>
