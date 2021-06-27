<script>
  import {
    ContextMenu,
    ContextMenuDivider,
    ContextMenuOption,
    ContextMenuRadioGroup,
  } from "carbon-components-svelte";

  let selectedId = "0";

  $: console.log("selectedId", selectedId);
</script>

<ContextMenu>
  <ContextMenuOption indented labelText="Open" />
  <ContextMenuDivider />
  <ContextMenuRadioGroup bind:selectedId labelText="Radio group">
    <ContextMenuOption id="0" labelText="Set as foreground" />
    <ContextMenuOption id="1" labelText="Set as background" />
  </ContextMenuRadioGroup>
  <ContextMenuDivider />
  <ContextMenuOption selectable labelText="Lock layer" />
</ContextMenu>

<div>
  <p>Right click anywhere on this page</p>
</div>

<style>
  div {
    position: absolute;
    width: calc(100% - var(--cds-spacing-05));
    height: calc(100% - var(--cds-spacing-06));
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--cds-text-02);
  }
</style>
