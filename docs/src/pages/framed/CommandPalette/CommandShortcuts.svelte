<script>
  import {
    Button,
    CommandPalette,
    CommandPaletteItem,
  } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import Settings from "carbon-icons-svelte/lib/Settings.svelte";

  let open = false;
  let lastAction = "";
</script>

<Button on:click={() => (open = true)}>Open command palette</Button>

<p style="margin-top: var(--cds-spacing-05)">
  With the palette open, press <kbd>⌘ N</kbd> or <kbd>⌘ ,</kbd> to run a command
  without clicking.
</p>

{#if lastAction}
  <p style="margin-top: var(--cds-spacing-03)">
    Last action: <strong>{lastAction}</strong>
  </p>
{/if}

<CommandPalette bind:open triggerKeys={[]}>
  <CommandPaletteItem
    id="new-doc"
    text="Create document"
    icon={Add}
    shortcut={["⌘", "N"]}
    run={() => {
      lastAction = "Created document";
    }}
  />
  <CommandPaletteItem
    id="settings"
    text="Open settings"
    icon={Settings}
    shortcut={["⌘", ","]}
    shortcutKeys="meta+,"
    run={() => {
      lastAction = "Opened settings";
    }}
  />
</CommandPalette>
