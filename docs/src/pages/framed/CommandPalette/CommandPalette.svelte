<script>
  import {
    Button,
    CommandPalette,
    CommandPaletteItem,
  } from "carbon-components-svelte";
  import Dashboard from "carbon-icons-svelte/lib/Dashboard.svelte";
  import Search from "carbon-icons-svelte/lib/Search.svelte";
  import Settings from "carbon-icons-svelte/lib/Settings.svelte";
  import UserAvatar from "carbon-icons-svelte/lib/UserAvatar.svelte";

  let open = false;
  let lastSelected = null;
</script>

<Button on:click={() => (open = true)}>Open command palette</Button>

{#if lastSelected}
  <p style="margin-top: var(--cds-spacing-05)">
    Last selected: <strong>{lastSelected}</strong>
  </p>
{/if}

<CommandPalette bind:open triggerKeys={[]}>
  <CommandPaletteItem
    id="home"
    text="Go to Dashboard"
    description="Overview of your workspace"
    icon={Dashboard}
    on:select={() => (lastSelected = "Go to Dashboard")}
  />
  <CommandPaletteItem
    id="new-doc"
    text="Create new document"
    shortcut={["⌘", "N"]}
    on:select={() => (lastSelected = "Create new document")}
  />
  <CommandPaletteItem
    id="search"
    text="Search documents"
    icon={Search}
    keywords={["find", "lookup"]}
    on:select={() => (lastSelected = "Search documents")}
  />
  <CommandPaletteItem
    id="profile"
    text="View profile"
    icon={UserAvatar}
    on:select={() => (lastSelected = "View profile")}
  />
  <CommandPaletteItem
    id="settings"
    text="Open settings"
    icon={Settings}
    shortcut={["⌘", ","]}
    on:select={() => (lastSelected = "Open settings")}
  />
</CommandPalette>
