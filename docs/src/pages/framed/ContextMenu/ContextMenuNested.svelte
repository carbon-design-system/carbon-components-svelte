<script>
  import {
    ContextMenu,
    ContextMenuDivider,
    ContextMenuGroup,
    ContextMenuOption,
  } from "carbon-components-svelte";
  import CopyFile from "carbon-icons-svelte/lib/CopyFile.svelte";
  import Cut from "carbon-icons-svelte/lib/Cut.svelte";

  let selectedIds = [];
</script>

<ContextMenu>
  <ContextMenuOption labelText="Copy" shortcutText="⌘C" icon={CopyFile} />
  <ContextMenuOption labelText="Cut" shortcutText="⌘X" icon={Cut} />
  <ContextMenuDivider />
  <ContextMenuOption indented labelText="Open with">
    <ContextMenuOption labelText="Preview" />
    <ContextMenuOption labelText="Editor" />
  </ContextMenuOption>
  <ContextMenuDivider />
  <ContextMenuOption indented labelText="Export as">
    <ContextMenuGroup labelText="Export formats" bind:selectedIds>
      <ContextMenuOption id="pdf" labelText="PDF" />
      <ContextMenuOption id="svg" labelText="SVG" />
      <ContextMenuOption id="png" labelText="PNG" />
    </ContextMenuGroup>
  </ContextMenuOption>
</ContextMenu>

<div data-centered>
  <p>Right click anywhere on this page</p>
</div>
