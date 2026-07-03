<script>
  import { Button, Menu, MenuItem } from "carbon-components-svelte";
  import Copy from "carbon-icons-svelte/lib/Copy.svelte";
  import Cut from "carbon-icons-svelte/lib/Cut.svelte";

  let anchor;
  let open = false;
</script>

<Button bind:ref={anchor} on:click={() => (open = !open)}>Actions</Button>

<Menu {anchor} bind:open labelText="Actions menu">
  <MenuItem icon={Cut} on:click={() => console.log("Cut")}>Cut</MenuItem>
  <MenuItem icon={Copy} on:click={() => console.log("Copy")}>Copy</MenuItem>
</Menu>
