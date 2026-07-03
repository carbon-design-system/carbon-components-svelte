<script lang="ts">
  import Menu from "carbon-components-svelte/Menu/Menu.svelte";
  import MenuDivider from "carbon-components-svelte/Menu/MenuDivider.svelte";
  import MenuItem from "carbon-components-svelte/Menu/MenuItem.svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";

  let anchor: HTMLButtonElement;
  let open = false;
</script>

<button type="button" bind:this={anchor} on:click={() => (open = !open)}>
  Trigger
</button>

<Menu {anchor} bind:open labelText="Example menu">
  <MenuItem icon={Add}>Add item</MenuItem>
  <MenuItem>Plain</MenuItem>
  <MenuItem labelText="Export as">
    <MenuItem on:click={() => console.log("select", "PDF")}>PDF</MenuItem>
    <MenuItem on:click={() => console.log("select", "JPG")}>JPG</MenuItem>
    <MenuItem disabled>PNG</MenuItem>
  </MenuItem>
  <MenuDivider />
  <MenuItem kind="danger">Delete</MenuItem>
</Menu>
