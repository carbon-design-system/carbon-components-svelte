<script>
  /** Specify the id for the main element */
  export let id = "main-content";

  import { isSideNavCollapsed, isSideNavRail } from "./navStore";

  /**
   * By default, the `SideNav` applies a left margin of `3rem` to `Content`
   * if it's a sibling component (e.g., .bx--side-nav ~ .bx--content).
   *
   * We manually unset the left margin if the `SideNav`
   * is collapsed and if it's not the `rail` variant.
   */
  $: unsetLeftMargin = $isSideNavCollapsed && !$isSideNavRail;
</script>

<main
  id="{id}"
  class:bx--content="{true}"
  style:margin-left="{unsetLeftMargin ? 0 : undefined}"
  {...$$restProps}
>
  <slot />
</main>
