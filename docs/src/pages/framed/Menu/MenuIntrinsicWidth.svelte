<script>
  import { Button, Menu, MenuItem } from "carbon-components-svelte";

  let anchor;
  let open = false;
</script>

<div style="width: 320px;">
  <Button bind:ref={anchor} on:click={() => (open = !open)}>
    Actions on this wide button
  </Button>
</div>

<Menu
  {anchor}
  bind:open
  intrinsicWidth
  intrinsicAlign="start"
  labelText="Actions menu"
>
  <MenuItem on:click={() => console.log("Cut")}>Cut</MenuItem>
  <MenuItem on:click={() => console.log("Copy")}>Copy</MenuItem>
  <MenuItem on:click={() => console.log("Paste")}>Paste</MenuItem>
</Menu>
