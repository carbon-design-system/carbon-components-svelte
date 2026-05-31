<script>
  import {
    Button,
    CommandPalette,
    CommandPaletteItem,
  } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import Dashboard from "carbon-icons-svelte/lib/Dashboard.svelte";
  import Settings from "carbon-icons-svelte/lib/Settings.svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Open small palette</Button>

<CommandPalette bind:open size="sm" triggerKeys={[]}>
  <CommandPaletteItem id="home" text="Go to Dashboard" icon={Dashboard} />
  <CommandPaletteItem id="new-doc" text="Create new document" icon={Add} />
  <CommandPaletteItem id="settings" text="Open settings" icon={Settings} />
</CommandPalette>
