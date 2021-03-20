<script lang="ts">
  import {
    ContextMenu,
    ContextMenuDivider,
    ContextMenuOption,
    ContextMenuRadioGroup,
    ContextMenuGroup,
  } from "../types";
  import CopyFile16 from "carbon-icons-svelte/lib/CopyFile16";
  import Cut16 from "carbon-icons-svelte/lib/Cut16";

  let selectedId = "0";
  let selectedIds = [];

  $: console.log("selectedId", selectedId);
</script>

<ContextMenu>
  <ContextMenuOption
    indented
    labelText="Copy"
    shortcutText="⌘C"
    icon="{CopyFile16}"
  />
  <ContextMenuOption
    indented
    labelText="Cut"
    shortcutText="⌘X"
    icon="{Cut16}"
  />
  <ContextMenuDivider />
  <ContextMenuOption indented labelText="Export as">
    <ContextMenuGroup labelText="Export options" bind:selectedIds>
      <ContextMenuOption id="pdf" labelText="PDF" />
      <ContextMenuOption id="txt" labelText="TXT" />
      <ContextMenuOption id="mp3" labelText="MP3" />
    </ContextMenuGroup>
  </ContextMenuOption>
  <ContextMenuDivider />
  <ContextMenuOption selectable labelText="Remove metadata" />
  <ContextMenuDivider />
  <ContextMenuGroup labelText="Style options">
    <ContextMenuOption id="0" labelText="Font smoothing" selected />
    <ContextMenuOption id="1" labelText="Reduce noise" />
    <ContextMenuOption id="2" labelText="Auto-sharpen" />
  </ContextMenuGroup>
</ContextMenu>

<ContextMenu on:open on:close>
  <ContextMenuOption indented labelText="Open" />
  <ContextMenuDivider />
  <ContextMenuRadioGroup bind:selectedId labelText="Radio group">
    <ContextMenuOption id="0" labelText="Set as foreground" />
    <ContextMenuOption id="1" labelText="Set as background" />
  </ContextMenuRadioGroup>
  <ContextMenuDivider />
  <ContextMenuOption indented labelText="Lock layer" />
</ContextMenu>
