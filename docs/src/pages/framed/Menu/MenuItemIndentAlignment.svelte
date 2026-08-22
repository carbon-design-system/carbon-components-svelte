<script>
  import {
    Button,
    Menu,
    MenuDivider,
    MenuItem,
    MenuItemGroup,
  } from "carbon-components-svelte";
  import Copy from "carbon-icons-svelte/lib/Copy.svelte";
  import Cut from "carbon-icons-svelte/lib/Cut.svelte";
  import Paste from "carbon-icons-svelte/lib/Paste.svelte";

  let anchor;
  let open = false;
  let selectedIds = ["bold"];
</script>

<Button bind:ref={anchor} on:click={() => (open = !open)}>Edit</Button>

<Menu {anchor} bind:open labelText="Edit menu">
  <MenuItem icon={Cut} shortcutText="⌘X" on:click={() => console.log("Cut")}>
    Cut
  </MenuItem>
  <MenuItem icon={Copy} shortcutText="⌘C" on:click={() => console.log("Copy")}>
    Copy
  </MenuItem>
  <MenuItem
    icon={Paste}
    shortcutText="⌘V"
    on:click={() => console.log("Paste")}
  >
    Paste
  </MenuItem>
  <MenuDivider />
  <MenuItemGroup labelText="Style" bind:selectedIds>
    <MenuItem id="bold" shortcutText="⌘B">Bold</MenuItem>
    <MenuItem id="italic" shortcutText="⌘I">Italic</MenuItem>
  </MenuItemGroup>
</Menu>
