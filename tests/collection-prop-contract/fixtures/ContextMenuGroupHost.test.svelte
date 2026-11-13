<script lang="ts">
  import ContextMenu from "carbon-components-svelte/ContextMenu/ContextMenu.svelte";
  import ContextMenuGroup from "carbon-components-svelte/ContextMenu/ContextMenuGroup.svelte";
  import ContextMenuOption from "carbon-components-svelte/ContextMenu/ContextMenuOption.svelte";
  import type { ComponentProps } from "svelte";

  export let selectedIds: ComponentProps<ContextMenuGroup>["selectedIds"] = [];
</script>

<ContextMenu open x={100} y={100}>
  <ContextMenuGroup labelText="Columns" {selectedIds}>
    <ContextMenuOption id="option1" labelText="Option 1" />
    <ContextMenuOption id="option2" labelText="Option 2" />
  </ContextMenuGroup>
</ContextMenu>
