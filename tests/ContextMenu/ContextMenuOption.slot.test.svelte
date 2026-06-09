<script lang="ts">
  import ContextMenu from "carbon-components-svelte/ContextMenu/ContextMenu.svelte";
  import ContextMenuOption from "carbon-components-svelte/ContextMenu/ContextMenuOption.svelte";
</script>

<ContextMenu open={true} x={0} y={0}>
  <ContextMenuOption labelText="Default label">
    <span slot="labelChildren">Custom label content</span>
  </ContextMenuOption>
</ContextMenu>
