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
      <ContextMenuOption
        id="compact"
        labelText="Compact"
        on:click={(e) => e.preventDefault()}
      />
    </ContextMenuRadioGroup>
  </ContextMenuOption>
</ContextMenu>

<div data-centered>
  <p>Right click anywhere on this page</p>
</div>
