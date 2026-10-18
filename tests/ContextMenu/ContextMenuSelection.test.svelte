<script lang="ts">
  import ContextMenu from "carbon-components-svelte/ContextMenu/ContextMenu.svelte";
  import ContextMenuGroup from "carbon-components-svelte/ContextMenu/ContextMenuGroup.svelte";
  import ContextMenuOption from "carbon-components-svelte/ContextMenu/ContextMenuOption.svelte";
  import ContextMenuRadioGroup from "carbon-components-svelte/ContextMenu/ContextMenuRadioGroup.svelte";
  import type { ComponentProps } from "svelte";

  export let selectedIds: ComponentProps<ContextMenuGroup>["selectedIds"] = [];
  export let selectedId: ComponentProps<ContextMenuRadioGroup>["selectedId"] =
    "";
</script>

<ContextMenu open x={100} y={100}>
  <ContextMenuGroup labelText="Columns" bind:selectedIds>
    <ContextMenuOption id="name" labelText="Name" />
    <ContextMenuOption id="date" labelText="Date" selected />
  </ContextMenuGroup>
  <ContextMenuRadioGroup labelText="View mode" bind:selectedId>
    <ContextMenuOption id="list" labelText="List" />
    <ContextMenuOption id="grid" labelText="Grid" selected />
  </ContextMenuRadioGroup>
</ContextMenu>

<div data-testid="selected-ids">{JSON.stringify(selectedIds)}</div>
<div data-testid="selected-id">{selectedId}</div>
