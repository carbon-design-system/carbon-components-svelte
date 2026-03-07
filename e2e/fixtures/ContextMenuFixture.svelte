<script>
  import { ContextMenu, ContextMenuOption } from "carbon-components-svelte";

  let target;
  let open = false;
</script>

<div data-testid="context-target" bind:this={target}>Right click me</div>

<ContextMenu bind:target {open}>
  <ContextMenuOption labelText="Option 1" />
  <ContextMenuOption labelText="Option 2" />
</ContextMenu>
