<script>
  import { Button, Menu, MenuItem } from "carbon-components-svelte";
  import Copy from "carbon-icons-svelte/lib/Copy.svelte";
  import Cut from "carbon-icons-svelte/lib/Cut.svelte";

  let anchor;
  let open = false;
</script>

<Button bind:ref={anchor} on:click={() => (open = !open)}>Actions</Button>

<Menu {anchor} bind:open labelText="Actions menu">
  <MenuItem icon={Cut} shortcutText="Alt+Shift+X">Cut</MenuItem>
  <MenuItem icon={Copy}>
    Copy
    <svelte:fragment slot="shortcutText">
      <em>Hold Shift to copy as plain text</em>
    </svelte:fragment>
  </MenuItem>
</Menu>
