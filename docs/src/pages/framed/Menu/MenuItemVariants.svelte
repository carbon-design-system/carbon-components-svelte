<script>
  import {
    Button,
    Menu,
    MenuDivider,
    MenuItem,
  } from "carbon-components-svelte";
  import Copy from "carbon-icons-svelte/lib/Copy.svelte";
  import Cut from "carbon-icons-svelte/lib/Cut.svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";

  let anchor;
  let open = false;
</script>

<Button bind:ref={anchor} on:click={() => (open = !open)}>Actions</Button>

<Menu {anchor} bind:open labelText="Actions menu">
  <MenuItem icon={Cut} on:click={() => console.log("Cut")}>Cut</MenuItem>
  <MenuItem icon={Copy} on:click={() => console.log("Copy")}>Copy</MenuItem>
  <MenuItem labelText="Export as">
    <MenuItem on:click={() => console.log("PDF")}>PDF</MenuItem>
    <MenuItem on:click={() => console.log("JPG")}>JPG</MenuItem>
  </MenuItem>
  <MenuDivider />
  <MenuItem
    icon={TrashCan}
    kind="danger"
    on:click={() => console.log("Delete")}
  >
    Delete
  </MenuItem>
</Menu>
