<script>
  import {
    ContextMenu,
    ContextMenuDivider,
    ContextMenuOption,
  } from "carbon-components-svelte";
  import CopyFile from "carbon-icons-svelte/lib/CopyFile.svelte";
  import Cut from "carbon-icons-svelte/lib/Cut.svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";
</script>

<ContextMenu labelText="Menu actions">
  <ContextMenuOption labelText="Copy" shortcutText="⌘C" icon={CopyFile} />
  <ContextMenuOption labelText="Cut" shortcutText="⌘X" icon={Cut} />
  <ContextMenuDivider />
  <ContextMenuOption kind="danger" labelText="Delete" icon={TrashCan} />
</ContextMenu>

<div data-centered>
  <p>Right click anywhere on this page</p>
</div>
