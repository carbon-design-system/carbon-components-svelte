<script lang="ts">
  import ContextMenu from "carbon-components-svelte/ContextMenu/ContextMenu.svelte";
  import ContextMenuOption from "carbon-components-svelte/ContextMenu/ContextMenuOption.svelte";

  export let selectable = true;
</script>

<ContextMenu open={true} x={100} y={100}>
  <ContextMenuOption id="opt" labelText="Toggle me" {selectable} />
</ContextMenu>
