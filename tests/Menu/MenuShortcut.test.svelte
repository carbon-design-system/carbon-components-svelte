<script lang="ts">
  import ContextMenu from "carbon-components-svelte/ContextMenu/ContextMenu.svelte";
  import ContextMenuOption from "carbon-components-svelte/ContextMenu/ContextMenuOption.svelte";
  import Menu from "carbon-components-svelte/Menu/Menu.svelte";
  import MenuItem from "carbon-components-svelte/Menu/MenuItem.svelte";
  import OverflowMenu from "carbon-components-svelte/OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "carbon-components-svelte/OverflowMenu/OverflowMenuItem.svelte";

  let anchor: HTMLButtonElement;
  let target: HTMLDivElement;
</script>

<button type="button" bind:this={anchor}>Trigger</button>
<Menu {anchor} open labelText="File">
  <MenuItem data-testid="save" labelText="Save" shortcut="ctrl+s" />
  <MenuItem
    data-testid="custom"
    labelText="Reload"
    shortcut="ctrl+r"
    shortcutText="F5"
  />
  <MenuItem data-testid="free-text" labelText="Copy" shortcut="⌘C" />
</Menu>

<div bind:this={target}>Area</div>
<ContextMenu target={target ? [target] : []} open labelText="Actions">
  <ContextMenuOption data-testid="copy" labelText="Copy" shortcut="ctrl+c" />
  <ContextMenuOption
    data-testid="paste"
    labelText="Paste"
    shortcut="ctrl+v"
    shortcutText="Paste key"
  />
  <ContextMenuOption
    data-testid="context-free-text"
    labelText="Cut"
    shortcut="⌘X"
  />
</ContextMenu>

<OverflowMenu open data-testid="overflow">
  <OverflowMenuItem data-testid="edit" text="Edit" shortcut="ctrl+e" />
  <OverflowMenuItem text="Plain" />
  <OverflowMenuItem
    data-testid="overflow-free-text"
    text="Duplicate"
    shortcut="⌘D"
  />
</OverflowMenu>
