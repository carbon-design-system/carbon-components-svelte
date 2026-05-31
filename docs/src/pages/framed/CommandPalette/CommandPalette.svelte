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

<CommandPalette
  bind:open
  triggerKeys={[]}
  on:select={(e) => {
    lastSelected = e.detail.item.text;
  }}
>
  <CommandPaletteItem
    id="home"
    text="Go to Dashboard"
    description="Overview of your workspace"
    icon={Dashboard}
  />
  <CommandPaletteItem
    id="new-doc"
    text="Create new document"
    shortcut={["⌘", "N"]}
  />
  <CommandPaletteItem
    id="search"
    text="Search documents"
    icon={Search}
    keywords={["find", "lookup"]}
  />
  <CommandPaletteItem id="profile" text="View profile" icon={UserAvatar} />
  <CommandPaletteItem
    id="settings"
    text="Open settings"
    icon={Settings}
    shortcut={["⌘", ","]}
  />
</CommandPalette>
