<script>
  import {
    Button,
    ContextMenu,
    ContextMenuOption,
    KeyboardShortcut,
    Menu,
    MenuItem,
    OverflowMenu,
    OverflowMenuItem,
  } from "carbon-components-svelte";

  // `?dir=rtl` sets the page direction before anything mounts, since the
  // menus read it when they open.
  if (new URLSearchParams(location.search).get("dir") === "rtl") {
    document.documentElement.dir = "rtl";
  }

  let anchor;
</script>

<main>
  <Button bind:ref={anchor}>Actions</Button>
  <Menu {anchor} open labelText="Actions">
    <MenuItem shortcut="mod+shift+p">Palette</MenuItem>
    <MenuItem shortcut="mod+s" shortcutText="Ctrl+S">Save</MenuItem>
    <MenuItem shortcut="mod+n" disabled>New</MenuItem>
    <MenuItem shortcut="mod+d" kind="danger">Delete</MenuItem>
    <MenuItem>Plain</MenuItem>
  </Menu>

  <ContextMenu open x={420} y={120}>
    <ContextMenuOption labelText="Palette" shortcut="mod+shift+p" />
    <ContextMenuOption labelText="Delete" kind="danger" shortcut="mod+d" />
  </ContextMenu>

  <div style="position: absolute; top: 280px; left: 420px;">
    <OverflowMenu open iconDescription="More">
      <OverflowMenuItem text="Rename">
        <KeyboardShortcut
          slot="iconRight"
          shortcut="f2"
          size="sm"
          variant="muted"
        />
      </OverflowMenuItem>
      <OverflowMenuItem text="Delete" danger />
    </OverflowMenu>
  </div>
</main>
