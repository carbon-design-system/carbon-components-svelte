<script lang="ts">
  import ContextMenu from "carbon-components-svelte/ContextMenu/ContextMenu.svelte";
  import ContextMenuOption from "carbon-components-svelte/ContextMenu/ContextMenuOption.svelte";
</script>

<ContextMenu open x={10} y={10}>
  <ContextMenuOption labelText="Copy" {...$$restProps} />
</ContextMenu>
