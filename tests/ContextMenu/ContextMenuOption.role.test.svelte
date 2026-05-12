<script lang="ts">
  import { ContextMenu, ContextMenuOption } from "carbon-components-svelte";

  export let selectable = true;
</script>

<ContextMenu open={true} x={100} y={100}>
  <ContextMenuOption id="opt" labelText="Toggle me" {selectable} />
</ContextMenu>
