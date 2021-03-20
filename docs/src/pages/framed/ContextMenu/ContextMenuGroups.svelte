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
