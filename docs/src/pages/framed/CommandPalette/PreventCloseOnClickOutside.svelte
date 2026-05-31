<script>
  import {
    Button,
    CommandPalette,
    CommandPaletteItem,
  } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import Settings from "carbon-icons-svelte/lib/Settings.svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Open palette</Button>

<p style="margin-top: var(--cds-spacing-05)">
  Clicking the backdrop does not close this palette. Use
  <strong>Escape</strong>, pick a command, or press the button again.
</p>

<CommandPalette bind:open preventCloseOnClickOutside triggerKeys={[]}>
  <CommandPaletteItem id="new" text="Create item" icon={Add} />
  <CommandPaletteItem id="settings" text="Open settings" icon={Settings} />
</CommandPalette>
