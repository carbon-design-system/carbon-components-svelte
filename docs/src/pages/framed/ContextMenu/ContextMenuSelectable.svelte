<script>
  import {
    ContextMenu,
    ContextMenuDivider,
    ContextMenuGroup,
    ContextMenuOption,
  } from "carbon-components-svelte";

  let selectedIds = [];

  $: console.log("selectedIds", selectedIds);
</script>

<ContextMenu>
  <ContextMenuOption selectable labelText="Remove metadata" />
  <ContextMenuDivider />
  <ContextMenuGroup labelText="Style options" bind:selectedIds>
    <ContextMenuOption id="0" labelText="Font smoothing" selected />
    <ContextMenuOption id="1" labelText="Reduce noise" />
    <ContextMenuOption id="2" labelText="Auto-sharpen" />
  </ContextMenuGroup>
</ContextMenu>

<div data-centered>
  <p>Right click anywhere on this page</p>
</div>
