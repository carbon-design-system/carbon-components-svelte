<script>
  import {
    ContextMenu,
    ContextMenuDivider,
    ContextMenuGroup,
    ContextMenuOption,
  } from "carbon-components-svelte";
  import CopyFile from "carbon-icons-svelte/lib/CopyFile.svelte";
  import Cut from "carbon-icons-svelte/lib/Cut.svelte";

  let target;
  let target2;
</script>

<ContextMenu target={[target, target2]} on:open={(e) => console.log(e.detail)}>
  <ContextMenuOption
    indented
    labelText="Copy"
    shortcutText="⌘C"
    icon={CopyFile}
  />
  <ContextMenuOption indented labelText="Cut" shortcutText="⌘X" icon={Cut} />
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

<div data-centered>
  <p data-outline bind:this={target}>Right click this element</p>
  <p data-outline bind:this={target2}>... or this one</p>
</div>
