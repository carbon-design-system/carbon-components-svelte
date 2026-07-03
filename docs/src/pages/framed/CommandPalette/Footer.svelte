<script>
  import {
    Button,
    CommandPalette,
    CommandPaletteItem,
  } from "carbon-components-svelte";
  import Dashboard from "carbon-icons-svelte/lib/Dashboard.svelte";
  import Settings from "carbon-icons-svelte/lib/Settings.svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Open command palette</Button>

<CommandPalette bind:open triggerKeys={[]}>
  <CommandPaletteItem id="home" text="Go to Dashboard" icon={Dashboard} />
  <CommandPaletteItem id="settings" text="Open settings" icon={Settings} />
  <div slot="footer" style="display: flex; gap: var(--cds-spacing-05);">
    <span>↑↓ navigate</span>
    <span>↵ select</span>
    <span>esc close</span>
  </div>
</CommandPalette>
