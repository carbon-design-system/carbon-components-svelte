<script lang="ts">
  import ContextMenu from "carbon-components-svelte/ContextMenu/ContextMenu.svelte";
  import ContextMenuGroup from "carbon-components-svelte/ContextMenu/ContextMenuGroup.svelte";
  import ContextMenuOption from "carbon-components-svelte/ContextMenu/ContextMenuOption.svelte";
  import ContextMenuRadioGroup from "carbon-components-svelte/ContextMenu/ContextMenuRadioGroup.svelte";
  import type { ComponentProps } from "svelte";

  export let selectedIds: ComponentProps<ContextMenuGroup>["selectedIds"] = [];
  export let selectedId: ComponentProps<ContextMenuRadioGroup>["selectedId"] =
    "list";

  export let open = false;
  export let x = 0;
  export let y = 0;
</script>

<ContextMenu bind:open {x} {y}>
  <ContextMenuGroup labelText="Columns" bind:selectedIds>
    <ContextMenuOption id="name" labelText="Name" />
    <ContextMenuOption
      id="date"
      labelText="Date"
      on:click={(e) => e.preventDefault()}
    />
  </ContextMenuGroup>
  <ContextMenuOption indented labelText="View as">
    <ContextMenuRadioGroup bind:selectedId labelText="View mode">
      <ContextMenuOption
        id="list"
        labelText="List"
        on:click={(e) => e.preventDefault()}
      />
      <ContextMenuOption
        id="grid"
        labelText="Grid"
        on:click={(e) => e.preventDefault()}
      />
    </ContextMenuRadioGroup>
  </ContextMenuOption>
</ContextMenu>

<div data-testid="selected-ids">{JSON.stringify(selectedIds)}</div>
<div data-testid="selected-id">{selectedId}</div>
