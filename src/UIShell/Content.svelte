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
   * By default, the `SideNav` applies a left margin of `3rem` to
   * `Content` if it's a sibling component (e.g., .bx--side-nav ~
   * .bx--content).
   *
   * Unset the left margin if:
   * - `SideNav` is collapsed and it's not the `rail` variant, OR
   * - `SideNav` overlays content on mobile (below the breakpoint)
   */
  $: unsetLeftMargin =
    ($isSideNavCollapsed && !$isSideNavRail) || $isSideNavMobile;

  // A resizable `SideNav` shares its width so the CSS margin can follow it;
  // custom properties don't inherit across siblings.
  $: sideNavWidthStyle =
    $sideNavWidth === undefined ? undefined : `${$sideNavWidth}px`;
</script>

<main
  {id}
  class:bx--content={true}
  style:margin-left={unsetLeftMargin ? 0 : undefined}
  style:--ccs-side-nav-width={sideNavWidthStyle}
  {...$$restProps}
>
  <slot />
</main>
