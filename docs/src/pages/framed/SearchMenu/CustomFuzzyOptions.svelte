<script>
  import { SearchMenu, SearchMenuItem } from "carbon-components-svelte";
  import { fuzzyMatch } from "carbon-components-svelte/src/utils/fuzzyMatch";

  let value = "Data";

  const resources = [
    "Data Table",
    "Data Store for Memcache",
    "Databases for TestSQL",
    "AT&T IoT Data Plans",
  ];

  // Reuse the built-in matcher, but raise the sensitivity threshold. A
  // `threshold` of 0.5 requires a contiguous substring, so a scattered
  // subsequence like "dt" (which the default fuzzy matching accepts for
  // "Data Table") no longer matches.
  const match = (text, query) => fuzzyMatch(text, query, { threshold: 0.5 });
</script>

<SearchMenu bind:value {match} labelText="Search" placeholder="Search...">
  {#each resources as text (text)}
    <SearchMenuItem {text} />
  {/each}
</SearchMenu>
