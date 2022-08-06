<script>
  /** Specify the id for the main element */
  export let id = "main-content";

  import { isSideNavCollapsed } from "./navStore";
</script>

<main
  id="{id}"
  class:bx--content="{true}"
  {...$$restProps}
  style="{$isSideNavCollapsed && 'margin-left: 0;'} {$$restProps.style}}"
>
  <slot />
</main>
