<script>
  import {
    Button,
    CommandPalette,
    CommandPaletteItem,
  } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import Dashboard from "carbon-icons-svelte/lib/Dashboard.svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>
  Open palette (try typing "xyz")
</Button>

<CommandPalette bind:open triggerKeys={[]}>
  <CommandPaletteItem id="home" text="Go to Dashboard" icon={Dashboard} />
  <CommandPaletteItem id="new-doc" text="Create new document" icon={Add} />
  <div
    slot="empty"
    let:value
    style="padding: var(--cds-spacing-05); text-align: center;"
  >
    No commands match <strong>"{value}"</strong>.
  </div>
</CommandPalette>
