<script>
  import {
    Button,
    CommandPalette,
    CommandPaletteItem,
  } from "carbon-components-svelte";
  import Settings from "carbon-icons-svelte/lib/Settings.svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Open palette</Button>

<p style="margin-top: var(--cds-spacing-05)">
  Try searching for <strong>config</strong> or <strong>prefs</strong>. The label
  says "Preferences", but keywords still match.
</p>

<CommandPalette bind:open triggerKeys={[]} placeholder="Search...">
  <CommandPaletteItem
    id="settings"
    text="Preferences"
    description="Workspace configuration"
    icon={Settings}
    keywords={["settings", "config", "prefs"]}
  />
</CommandPalette>
