<script>
  /** @extends {"../OverflowMenu/OverflowMenuItem.svelte"} OverflowMenuItemProps */

  import OverflowMenuItem from "../OverflowMenu/OverflowMenuItem.svelte";
</script>

<OverflowMenuItem {...$$restProps} on:click on:keydown>
  <slot />
</OverflowMenuItem>
