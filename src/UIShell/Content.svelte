<script>
  /** Specify the id for the main element */
  export let id = "main-content";

  import { isSideNavExpanded, isSideNavRail } from "./navStore";

  /**
   * By default, the `SideNav` applies a left margin of `3rem` to `Content`
   * if it's a sibling component (e.g., .bx--side-nav ~ .bx--content).
   *
   * We manually unset the left margin if the `SideNav`
   * is collapsed and if it's not the `rail` variant.
   */
  $: unsetLeftMargin = !$isSideNavRail && !$isSideNavExpanded;
</script>

<main
  id="{id}"
  class:bx--content="{true}"
  style="{unsetLeftMargin ? 'margin-left: 0' : ''}"
  {...$$restProps}
>
  <slot />
</main>
