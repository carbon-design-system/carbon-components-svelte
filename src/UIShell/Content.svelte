<script>
  /**
   * @restProps {main | div}
   */

  /**
   * Specify the id for the content element: a `main`, or a `div` inside a
   * `UIShellContainer`. Inside a container the default is unique to it.
   */
  export let id = "main-content";

  import { getNavStores } from "./nav-store.js";

  const {
    isSideNavCollapsed,
    isSideNavMobile,
    isSideNavRail,
    sideNavWidth,
    contained,
    contentId,
  } = getNavStores();

  // Two contained shells on a page can't both be `#main-content`.
  $: resolvedId = contained && id === "main-content" ? contentId : id;

  /**
   * By default, the `SideNav` applies an inline-start margin of `3rem` to
   * `Content` if it's a sibling component (e.g., .bx--side-nav ~ .bx--content).
   * It is the left margin, or the right one under `dir="rtl"`.
   *
   * Unset the margin if `SideNav` is not the `rail` variant and:
   * - it's collapsed, OR
   * - it overlays content on mobile (below the breakpoint)
   *
   * The rail stays visible on mobile, so keep its `3rem` margin there.
   * Pin it so an expanded rail overlays content instead of pushing it.
   */
  $: marginInlineStart = $isSideNavRail
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

<!-- A page has one main landmark; a contained shell is part of a page. -->
<svelte:element
  this={contained ? "div" : "main"}
  id={resolvedId}
  class:bx--content={true}
  style:margin-inline-start={marginInlineStart}
  style:--ccs-side-nav-width={sideNavWidthStyle}
  {...$$restProps}
>
  <slot />
</svelte:element>
