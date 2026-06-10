<script>
  import { SearchMenu, SearchMenuItem } from "carbon-components-svelte";

  let value = "data";

  const resources = [
    "Databases for TestSQL",
    "AT&T IoT Data Plans",
    "Data Store for Memcache",
    "HazardHub Property Risk Data API",
    "Managed Financial Data API",
  ];

  // Custom matcher: a case-insensitive substring match.
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

<!--
  Use the default slot with `let:segments` to render the label yourself. Each
  segment is `{ text, match }`, so no `{@html}` is needed -- wrap matched runs
  in your own markup. Keep the `{#each}` compact so adjacent segments are not
  split by whitespace.
-->
<SearchMenu bind:value {match} labelText="Search" placeholder="Search...">
  {#each resources as text (text)}
    <SearchMenuItem {text} let:segments
      >{#each segments as segment}
        {#if segment.match}
          <mark>{segment.text}</mark>
        {:else}
          {segment.text}
        {/if}
      {/each}</SearchMenuItem
    >
  {/each}
</SearchMenu>

<style>
  mark {
    background: #f1c21b;
    color: #161616;
  }
</style>
