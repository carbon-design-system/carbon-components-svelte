<script>
  import {
    Button,
    CommandPalette,
    CommandPaletteItem,
    Toggle,
  } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import Locked from "carbon-icons-svelte/lib/Locked.svelte";

  let open = false;
  let locked = false;
  let message = "";

  function onClose(event) {
    if (locked) {
      event.preventDefault();
      message = "Palette is locked — toggle it off to close.";
    }
  }
</script>

<Toggle bind:toggled={locked} labelText="Lock palette (prevents close)" />
<Button on:click={() => (open = true)}>Open palette</Button>

{#if message}
  <p style="margin-top: var(--cds-spacing-05)">{message}</p>
{/if}

<CommandPalette bind:open triggerKeys={[]} on:close={onClose}>
  <CommandPaletteItem
    id="new-doc"
    text="Create new document"
    icon={Add}
    on:select={() => (message = "Ran: Create new document")}
  />
  <CommandPaletteItem
    id="coming-soon"
    text="Export workspace"
    description="Coming soon"
    icon={Locked}
    on:select={(e) => {
      e.preventDefault();
      message = "That command isn't available yet.";
    }}
  />
</CommandPalette>
