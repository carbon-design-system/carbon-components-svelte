<script>
  import {
    Button,
    CommandPalette,
    CommandPaletteGroup,
    CommandPaletteItem,
  } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import Dashboard from "carbon-icons-svelte/lib/Dashboard.svelte";
  import Document from "carbon-icons-svelte/lib/Document.svelte";
  import Settings from "carbon-icons-svelte/lib/Settings.svelte";
  import UserAvatar from "carbon-icons-svelte/lib/UserAvatar.svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Open grouped palette</Button>

<CommandPalette bind:open triggerKeys={[]} placeholder="Jump to...">
  <CommandPaletteGroup label="Navigation">
    <CommandPaletteItem id="dashboard" text="Dashboard" icon={Dashboard} />
    <CommandPaletteItem id="docs" text="Documents" icon={Document} />
  </CommandPaletteGroup>
  <CommandPaletteGroup label="Actions">
    <CommandPaletteItem
      id="new"
      text="New document"
      icon={Add}
      shortcut={["⌘", "N"]}
    />
    <CommandPaletteItem
      id="invite"
      text="Invite teammate"
      icon={UserAvatar}
      disabled
    />
  </CommandPaletteGroup>
  <CommandPaletteGroup label="Settings">
    <CommandPaletteItem id="theme" text="Toggle theme" icon={Settings} />
    <CommandPaletteItem id="account" text="Account settings" icon={Settings} />
  </CommandPaletteGroup>
</CommandPalette>
