<script>
  import { Button, Menu, MenuItem } from "carbon-components-svelte";

  let anchor;
  let open = false;
</script>

<Button bind:ref={anchor} on:click={() => (open = !open)}>Actions</Button>

<Menu {anchor} bind:open labelText="Actions menu">
  <MenuItem on:click={() => console.log("Cut")}>Cut</MenuItem>
  <MenuItem on:click={() => console.log("Copy")}>Copy</MenuItem>
  <MenuItem labelText="Export as">
    <MenuItem on:click={() => console.log("PDF")}>PDF</MenuItem>
    <MenuItem on:click={() => console.log("JPG")}>JPG</MenuItem>
    <MenuItem on:click={() => console.log("PNG")}>PNG</MenuItem>
  </MenuItem>
</Menu>
