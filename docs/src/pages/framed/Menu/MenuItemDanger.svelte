<script>
  import {
    Button,
    Menu,
    MenuDivider,
    MenuItem,
  } from "carbon-components-svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";

  let anchor;
  let open = false;
</script>

<Button bind:ref={anchor} on:click={() => (open = !open)}>Actions</Button>

<Menu {anchor} bind:open labelText="Actions menu">
  <MenuItem on:click={() => console.log("Cut")}>Cut</MenuItem>
  <MenuItem on:click={() => console.log("Copy")}>Copy</MenuItem>
  <MenuDivider />
  <MenuItem
    icon={TrashCan}
    kind="danger"
    on:click={() => console.log("Delete")}
  >
    Delete
  </MenuItem>
</Menu>
