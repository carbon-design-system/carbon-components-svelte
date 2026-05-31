<script>
  import {
    Button,
    CommandPalette,
    CommandPaletteItem,
  } from "carbon-components-svelte";

  let open = false;
  let value = "Data";

  const resources = [
    "Data Table",
    "Data Store for Memcache",
    "Databases for TestSQL",
  ];

  function match(text, query) {
    const q = query.trim().toLowerCase();
    if (q === "") return { matched: true, indices: [] };
    const start = text.toLowerCase().indexOf(q);
    if (start === -1) return { matched: false, indices: [] };
    return {
      matched: true,
      indices: Array.from({ length: q.length }, (_, i) => start + i),
    };
  }
</script>

<Button on:click={() => (open = true)}>Open palette</Button>

<CommandPalette bind:open bind:value {match} triggerKeys={[]}>
  {#each resources as text, index (text)}
    <CommandPaletteItem id={`item-${index}`} {text} let:segments
      >{#each segments as segment}
        {#if segment.match}
          <mark>{segment.text}</mark>
        {:else}
          {segment.text}
        {/if}
      {/each}</CommandPaletteItem
    >
  {/each}
</CommandPalette>

<style>
  mark {
    background: #f1c21b;
    color: #161616;
  }
</style>
