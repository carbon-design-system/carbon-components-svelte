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

<ContextMenu>
  <ContextMenuOption labelText="Plain label" />
  <ContextMenuOption labelText="With shortcut" shortcutText="⌘K" />
  <ContextMenuOption labelText="Copy" shortcutText="⌘C" icon={CopyFile} />
  <ContextMenuDivider />
  <ContextMenuOption indented labelText="Indented without icon" />
  <ContextMenuDivider />
  <ContextMenuOption
    disabled
    labelText="Disabled"
    shortcutText="⌘D"
    icon={Cut}
  />
  <ContextMenuDivider />
  <ContextMenuOption kind="danger" labelText="Delete" icon={TrashCan} />
</ContextMenu>

<div data-centered>
  <p>Right click anywhere on this page</p>
</div>
