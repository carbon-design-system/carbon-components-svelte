<script lang="ts">
  import { ContextMenu, ContextMenuOption } from "carbon-components-svelte";
</script>

<ContextMenu open={true} x={0} y={0}>
  <ContextMenuOption labelText="Default label">
    <span slot="labelText">Custom label content</span>
  </ContextMenuOption>
</ContextMenu>
