<script lang="ts">
  import {
    ContextMenu,
    ContextMenuDivider,
    ContextMenuOption,
    ContextMenuRadioGroup,
    ContextMenuGroup,
  } from "../types";
  import CopyFile from "carbon-icons-svelte/lib/CopyFile.svelte";
  import Cut from "carbon-icons-svelte/lib/Cut.svelte";

  let ref: HTMLElement;
  let selectedId = "0";
  let selectedIds = [];

  $: console.log("selectedId", selectedId);
</script>

<div bind:this="{ref}"></div>

<ContextMenu target="{null}" open on:open="{(e) => console.log(e.detail)}">
  <ContextMenuOption
    kind="danger"
    indented
    labelText="Copy"
    shortcutText="⌘C"
    icon="{CopyFile}"
  />
  <ContextMenuOption indented labelText="Cut" shortcutText="⌘X" icon="{Cut}" />
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

<ContextMenu target="{[null, ref]}" on:open on:close>
  <ContextMenuOption indented labelText="Open" />
  <ContextMenuDivider />
  <ContextMenuRadioGroup bind:selectedId labelText="Radio group">
    <ContextMenuOption id="0" labelText="Set as foreground" />
    <ContextMenuOption id="1" labelText="Set as background" />
  </ContextMenuRadioGroup>
  <ContextMenuDivider />
  <ContextMenuOption indented labelText="Lock layer" />
</ContextMenu>
