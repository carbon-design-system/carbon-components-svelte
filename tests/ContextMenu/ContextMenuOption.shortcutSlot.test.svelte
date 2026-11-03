<script lang="ts">
  import ContextMenu from "carbon-components-svelte/ContextMenu/ContextMenu.svelte";
  import ContextMenuOption from "carbon-components-svelte/ContextMenu/ContextMenuOption.svelte";
</script>

<ContextMenu open={true} x={0} y={0}>
  <ContextMenuOption labelText="New" shortcutText="Ignored">
    <span slot="shortcutChildren">New shortcut</span>
  </ContextMenuOption>
  <ContextMenuOption labelText="Old" shortcutText="Ignored">
    <span slot="shortcutText">Old shortcut</span>
  </ContextMenuOption>
  <ContextMenuOption labelText="Both" shortcutText="Ignored">
    <span slot="shortcutChildren">Both new</span>
    <span slot="shortcutText">Both old</span>
  </ContextMenuOption>
</ContextMenu>
