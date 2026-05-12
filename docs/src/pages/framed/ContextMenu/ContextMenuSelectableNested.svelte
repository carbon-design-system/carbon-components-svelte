<script>
  import {
    ContextMenu,
    ContextMenuDivider,
    ContextMenuGroup,
    ContextMenuOption,
  } from "carbon-components-svelte";

  let selectedIds = ["guides"];
</script>

<ContextMenu>
  <ContextMenuOption indented labelText="Open" />
  <ContextMenuDivider />
  <ContextMenuOption indented labelText="Layers">
    <ContextMenuGroup labelText="Visible layers" bind:selectedIds>
      <ContextMenuOption id="guides" labelText="Guides" />
      <ContextMenuOption id="grid" labelText="Grid" />
      <ContextMenuOption id="annotations" labelText="Annotations" />
    </ContextMenuGroup>
  </ContextMenuOption>
</ContextMenu>

<div data-centered>
  <p>Right click anywhere on this page</p>
</div>
