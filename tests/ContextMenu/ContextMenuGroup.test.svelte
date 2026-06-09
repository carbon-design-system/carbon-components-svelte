<script lang="ts">
  import ContextMenu from "carbon-components-svelte/ContextMenu/ContextMenu.svelte";
  import ContextMenuGroup from "carbon-components-svelte/ContextMenu/ContextMenuGroup.svelte";
  import ContextMenuOption from "carbon-components-svelte/ContextMenu/ContextMenuOption.svelte";
  import type { ComponentProps } from "svelte";

  export let selectedIds: ComponentProps<ContextMenuGroup>["selectedIds"] = [];
</script>

<ContextMenu open={true} x={100} y={100}>
  <ContextMenuGroup labelText="Test group" bind:selectedIds>
    <ContextMenuOption id="option1" labelText="Option 1" />
    <ContextMenuOption id="option2" labelText="Option 2" />
    <ContextMenuOption id="option3" labelText="Option 3" />
  </ContextMenuGroup>
</ContextMenu>

<div data-testid="selected-ids">{JSON.stringify(selectedIds)}</div>
