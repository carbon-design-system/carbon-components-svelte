<script>
  import {
    ContextMenu,
    ContextMenuDivider,
    ContextMenuGroup,
    ContextMenuOption,
  } from "carbon-components-svelte";
  import CopyFile16 from "carbon-icons-svelte/lib/CopyFile16";
  import Cut16 from "carbon-icons-svelte/lib/Cut16";

  let target;
  let target2;
</script>

<ContextMenu
  target="{[target, target2]}"
  on:open="{(e) => console.log(e.detail)}"
>
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
    <ContextMenuGroup labelText="Export options">
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
  <ContextMenuDivider />
  <ContextMenuOption indented kind="danger" labelText="Delete" />
</ContextMenu>

<div>
  <p bind:this="{target}">Right click this element</p>
  <p bind:this="{target2}">... or this one</p>
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

  p {
    outline: 1px solid var(--cds-interactive-01);
  }
</style>
