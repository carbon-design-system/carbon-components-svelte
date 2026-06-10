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

  // Custom prefix matcher: only items whose text starts with the query match.
  // `matched` filters items out; `indices` are the characters to highlight.
  function match(text, query) {
    const q = query.trim().toLowerCase();
    if (q === "") return { matched: true, indices: [] };
    const matched = text.toLowerCase().startsWith(q);
    return {
      matched,
      indices: matched ? Array.from({ length: q.length }, (_, i) => i) : [],
    };
  }
</script>

<SearchMenu bind:value {match} labelText="Search" placeholder="Search...">
  {#each resources as text (text)}
    <SearchMenuItem {text} />
  {/each}
</SearchMenu>
