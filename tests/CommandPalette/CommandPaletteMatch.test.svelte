<script lang="ts">
  import CommandPalette from "carbon-components-svelte/CommandPalette/CommandPalette.svelte";
  import CommandPaletteItem from "carbon-components-svelte/CommandPalette/CommandPaletteItem.svelte";

  export let open = false;
  export let value = "";
  export let match: (
    text: string,
    query: string,
  ) => { matched: boolean; indices?: number[] } = (text, query) => {
    const q = query.trim();
    if (q === "") return { matched: true, indices: [] };
    const start = text.indexOf(q);
    if (start === -1) return { matched: false, indices: [] };
    return {
      matched: true,
      indices: Array.from({ length: q.length }, (_, i) => start + i),
    };
  };

  const items = ["Data Store", "data lake", "Metadata"];
</script>

<button type="button" on:click={() => (open = true)}>Open</button>

<CommandPalette bind:open bind:value {match} triggerKeys={[]}>
  {#each items as text, index (text)}
    <CommandPaletteItem id={`item-${index}`} {text} />
  {/each}
</CommandPalette>
