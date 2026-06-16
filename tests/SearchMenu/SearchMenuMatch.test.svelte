<script lang="ts">
  import SearchMenu from "carbon-components-svelte/SearchMenu/SearchMenu.svelte";
  import SearchMenuItem from "carbon-components-svelte/SearchMenu/SearchMenuItem.svelte";

  export let value = "";

  // Default override: a case-sensitive substring match with custom highlight
  // indices. Tests can pass their own `match` (e.g. a no-op) via props.
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

<SearchMenu bind:value {match} labelText="Search" placeholder="Search...">
  {#each items as text (text)}
    <SearchMenuItem {text} />
  {/each}
</SearchMenu>
