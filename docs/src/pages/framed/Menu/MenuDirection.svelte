<script>
  import { Button, Menu, MenuItem } from "carbon-components-svelte";

  let anchor;
  let open = false;
</script>

<div style="margin-top: 220px;">
  <Button bind:ref={anchor} on:click={() => (open = !open)}>Actions</Button>
</div>

<Menu {anchor} direction="top" bind:open labelText="Actions menu">
  <MenuItem on:click={() => console.log("Cut")}>Cut</MenuItem>
  <MenuItem on:click={() => console.log("Copy")}>Copy</MenuItem>
  <MenuItem on:click={() => console.log("Paste")}>Paste</MenuItem>
</Menu>
