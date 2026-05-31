<script>
  import {
    Button,
    CommandPalette,
    CommandPaletteGroup,
    CommandPaletteItem,
    Tag,
  } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import Dashboard from "carbon-icons-svelte/lib/Dashboard.svelte";
  import Settings from "carbon-icons-svelte/lib/Settings.svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Open custom palette</Button>

<CommandPalette bind:open triggerKeys={[]}>
  <CommandPaletteGroup label="Routes">
    <CommandPaletteItem id="home" text="Go to Dashboard" icon={Dashboard} />
  </CommandPaletteGroup>
  <CommandPaletteGroup label="Actions">
    <CommandPaletteItem
      id="new-doc"
      text="Create new document"
      icon={Add}
      let:active
      let:segments
    >
      {#each segments as segment}
        {#if segment.match}
          <strong>{segment.text}</strong>
        {:else}
          {segment.text}
        {/if}
      {/each}
      {#if active}
        <Tag size="sm" type="blue">↵ Enter</Tag>
      {/if}
    </CommandPaletteItem>
    <CommandPaletteItem id="settings" text="Open settings" icon={Settings} />
  </CommandPaletteGroup>
</CommandPalette>
