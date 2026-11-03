<script>
  import { Button, Menu, MenuItem } from "carbon-components-svelte";
  import Copy from "carbon-icons-svelte/lib/Copy.svelte";
  import Cut from "carbon-icons-svelte/lib/Cut.svelte";
  import Paste from "carbon-icons-svelte/lib/Paste.svelte";

  let anchor;
  let open = false;
</script>

<Button bind:ref={anchor} on:click={() => (open = !open)}>Actions</Button>

<Menu {anchor} bind:open labelText="Actions menu">
  <MenuItem icon={Cut} shortcut="mod+x" on:click={() => console.log("Cut")}>
    Cut
  </MenuItem>
  <MenuItem icon={Copy} shortcut="mod+c" on:click={() => console.log("Copy")}>
    Copy
  </MenuItem>
  <MenuItem icon={Paste} shortcut="mod+v" on:click={() => console.log("Paste")}>
    Paste
  </MenuItem>
</Menu>
