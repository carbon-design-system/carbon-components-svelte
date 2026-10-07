<script>
  /** Specify the id for the main element */
  export let id = "main-content";

  import {
    isSideNavCollapsed,
    isSideNavMobile,
    isSideNavRail,
    sideNavWidth,
  } from "./nav-store.js";

  /**
   * By default, the `SideNav` applies a left margin of `3rem` to `Content`
   * if it's a sibling component (e.g., .bx--side-nav ~ .bx--content).
   *
   * Unset the left margin if `SideNav` is not the `rail` variant and:
   * - it's collapsed, OR
   * - it overlays content on mobile (below the breakpoint)
   *
   * The rail stays visible on mobile, so keep its `3rem` margin there.
   * Pin it so an expanded rail overlays content instead of pushing it.
   */
  $: marginLeft = $isSideNavRail
    ? $isSideNavMobile
      ? "3rem"
      : undefined
    : $isSideNavCollapsed || $isSideNavMobile
      ? 0
      : undefined;

  // A resizable `SideNav` shares its width so the CSS margin can follow it;
  // custom properties don't inherit across siblings.
  $: sideNavWidthStyle =
    $sideNavWidth === undefined ? undefined : `${$sideNavWidth}px`;
</script>

<main
  {id}
  class:bx--content={true}
  style:margin-left={marginLeft}
  style:--ccs-side-nav-width={sideNavWidthStyle}
  {...$$restProps}
>
  <slot />
</main>
