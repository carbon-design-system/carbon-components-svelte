<script>
  import { Button, Menu, MenuItem } from "carbon-components-svelte";

  let anchor;
  let open = false;
</script>

<Button bind:ref={anchor} on:click={() => (open = !open)}>Actions</Button>

<Menu {anchor} size="md" bind:open labelText="Actions menu">
  <MenuItem on:click={() => console.log("Cut")}>Cut</MenuItem>
  <MenuItem on:click={() => console.log("Copy")}>Copy</MenuItem>
  <MenuItem on:click={() => console.log("Paste")}>Paste</MenuItem>
</Menu>
