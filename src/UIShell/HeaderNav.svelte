<script>
  import { getContext } from "svelte";
  import { readable } from "svelte/store";
  import { EXPANSION_BREAKPOINT } from "./expansion-breakpoint.js";

  const { expansionBreakpoint, winWidth } = getContext("carbon:Header") ?? {
    expansionBreakpoint: readable(EXPANSION_BREAKPOINT),
    winWidth: readable(undefined),
  };

  // Only a custom breakpoint with a known width needs marker classes. The
  // default path stays pure CSS so server-rendered pages don't shift layout.
  $: custom =
    $expansionBreakpoint !== EXPANSION_BREAKPOINT && $winWidth !== undefined;
  $: expanded = custom && $winWidth >= $expansionBreakpoint;
</script>

<nav
  class:bx--header__nav={true}
  class:bx--header__nav--expanded={custom && expanded}
  class:bx--header__nav--collapsed={custom && !expanded}
  {...$$restProps}
>
  <ul role="menubar" class:bx--header__menu-bar={true}>
    <slot />
  </ul>
</nav>
