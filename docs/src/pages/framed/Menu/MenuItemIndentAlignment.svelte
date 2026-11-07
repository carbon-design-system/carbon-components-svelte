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
  import TextBold from "carbon-icons-svelte/lib/TextBold.svelte";
  import TextItalic from "carbon-icons-svelte/lib/TextItalic.svelte";

  let anchor;
  let open = false;
  let selectedIds = ["bold"];
</script>

<Button bind:ref={anchor} on:click={() => (open = !open)}>Edit</Button>

<Menu {anchor} bind:open labelText="Edit menu">
  <MenuItem icon={Cut} shortcut="mod+x" on:click={() => console.log("Cut")}>
    Cut
  </MenuItem>
  <MenuItem icon={Copy} shortcut="mod+c" on:click={() => console.log("Copy")}>
    Copy
  </MenuItem>
  <MenuItem icon={Paste} shortcut="mod+v" on:click={() => console.log("Paste")}>
    Paste
  </MenuItem>
  <MenuDivider />
  <MenuItemGroup labelText="Style" bind:selectedIds>
    <MenuItem id="bold" icon={TextBold} shortcut="mod+b">Bold</MenuItem>
    <MenuItem id="italic" icon={TextItalic} shortcut="mod+i">Italic</MenuItem>
  </MenuItemGroup>
</Menu>
