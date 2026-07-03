<script>
  import {
    Button,
    CommandPalette,
    CommandPaletteItem,
  } from "carbon-components-svelte";
  import Dashboard from "carbon-icons-svelte/lib/Dashboard.svelte";
  import Search from "carbon-icons-svelte/lib/Search.svelte";
  import Settings from "carbon-icons-svelte/lib/Settings.svelte";

  let open = false;
  let activeId = "search";
</script>

<Button on:click={() => (open = true)}>Open command palette</Button>

<CommandPalette bind:open bind:activeId triggerKeys={[]}>
  <CommandPaletteItem id="home" text="Go to Dashboard" icon={Dashboard} />
  <CommandPaletteItem id="search" text="Search documents" icon={Search} />
  <CommandPaletteItem id="settings" text="Open settings" icon={Settings} />
</CommandPalette>
