<script>
  import {
    ContextMenu,
    ContextMenuDivider,
    ContextMenuOption,
    ContextMenuRadioGroup,
  } from "carbon-components-svelte";

  let selectedId = "list";
</script>

<ContextMenu>
  <ContextMenuOption labelText="Open" />
  <ContextMenuDivider />
  <ContextMenuOption labelText="View as">
    <ContextMenuRadioGroup bind:selectedId labelText="View mode">
      <ContextMenuOption id="list" labelText="List" />
      <ContextMenuOption id="grid" labelText="Grid" />
      <ContextMenuOption id="compact" labelText="Compact" />
    </ContextMenuRadioGroup>
  </ContextMenuOption>
</ContextMenu>

<div data-centered>
  <p>Right click anywhere on this page</p>
</div>
