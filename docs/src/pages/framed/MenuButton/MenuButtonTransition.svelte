<script>
  import { MenuButton, MenuItem } from "carbon-components-svelte";
</script>

<MenuButton labelText="Actions" transition>
  <MenuItem on:click={() => console.log("Cut")}>Cut</MenuItem>
  <MenuItem on:click={() => console.log("Copy")}>Copy</MenuItem>
  <MenuItem labelText="Export as">
    <MenuItem on:click={() => console.log("PDF")}>PDF</MenuItem>
    <MenuItem on:click={() => console.log("PNG")}>PNG</MenuItem>
  </MenuItem>
</MenuButton>
