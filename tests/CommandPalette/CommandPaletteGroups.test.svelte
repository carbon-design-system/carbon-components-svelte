<script lang="ts">
  import CommandPalette from "carbon-components-svelte/CommandPalette/CommandPalette.svelte";
  import CommandPaletteGroup from "carbon-components-svelte/CommandPalette/CommandPaletteGroup.svelte";
  import CommandPaletteItem from "carbon-components-svelte/CommandPalette/CommandPaletteItem.svelte";

  export let open = false;
  export let value = "";
</script>

<button type="button" on:click={() => (open = true)}>Open</button>

<CommandPalette bind:open bind:value triggerKeys={[]}>
  <CommandPaletteGroup label="Navigation">
    <CommandPaletteItem id="nav-1" text="Dashboard" />
    <CommandPaletteItem id="nav-2" text="Documents" />
  </CommandPaletteGroup>
  <CommandPaletteGroup label="Actions">
    <CommandPaletteItem id="act-1" text="New document" />
    <CommandPaletteItem id="act-2" text="Invite teammate" disabled />
  </CommandPaletteGroup>
</CommandPalette>
