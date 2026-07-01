<script>
  import {
    Button,
    CommandPalette,
    CommandPaletteItem,
  } from "carbon-components-svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Open palette without icons</Button>

<CommandPalette bind:open triggerKeys={[]}>
  <CommandPaletteItem
    id="new"
    text="Create new document"
    shortcut={["⌘", "N"]}
  />
  <CommandPaletteItem id="rename" text="Rename document" />
  <CommandPaletteItem id="duplicate" text="Duplicate document" />
  <CommandPaletteItem id="dashboard" text="Go to Dashboard" />
  <CommandPaletteItem
    id="settings"
    text="Open settings"
    shortcut={["⌘", ","]}
  />
</CommandPalette>
