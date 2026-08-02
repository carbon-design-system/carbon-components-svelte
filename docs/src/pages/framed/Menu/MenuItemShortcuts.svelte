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
  <MenuItem icon={Cut} shortcutText="⌘X" on:click={() => console.log("Cut")}>
    Cut
  </MenuItem>
  <MenuItem icon={Copy} shortcutText="⌘C" on:click={() => console.log("Copy")}>
    Copy
  </MenuItem>
  <MenuItem
    icon={Paste}
    shortcutText="⌘V"
    on:click={() => console.log("Paste")}
  >
    Paste
  </MenuItem>
</Menu>
