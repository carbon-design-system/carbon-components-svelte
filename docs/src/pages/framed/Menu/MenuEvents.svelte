<script>
  import { Button, Menu, MenuItem } from "carbon-components-svelte";

  let anchor;
  let open = false;
</script>

<Button bind:ref={anchor} on:click={() => (open = !open)}>Actions</Button>

<Menu
  {anchor}
  bind:open
  labelText="Actions menu"
  on:open={(e) => console.log("open", e.detail)}
  on:close={(e) => console.log("close", e.detail.trigger)}
>
  <MenuItem on:click={() => console.log("Cut")}>Cut</MenuItem>
  <MenuItem on:click={() => console.log("Copy")}>Copy</MenuItem>
  <MenuItem on:click={() => console.log("Paste")}>Paste</MenuItem>
</Menu>
