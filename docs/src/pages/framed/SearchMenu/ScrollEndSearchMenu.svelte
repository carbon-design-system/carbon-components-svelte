<script>
  import { SearchMenu, SearchMenuItem } from "carbon-components-svelte";

  const PAGE_SIZE = 6;
  const TOTAL = 36;

  let results = [];
  let loading = false;
  let hasMore = true;

  function makePage(offset) {
    return Array.from(
      { length: Math.min(PAGE_SIZE, TOTAL - offset) },
      (_, i) => `INC-${4201 + offset + i}: API gateway latency above threshold`,
    );
  }

  async function loadMore() {
    if (loading || !hasMore) return;
    loading = true;
    await new Promise((resolve) => setTimeout(resolve, 400));
    results = [...results, ...makePage(results.length)];
    hasMore = results.length < TOTAL;
    loading = false;
  }

  loadMore();
</script>

<SearchMenu
  labelText="Search incidents"
  placeholder="Open and scroll to the bottom…"
  shouldFilter={false}
  menuMaxHeight={200}
  {loading}
  on:scrollend={loadMore}
>
  {#each results as result (result)}
    <SearchMenuItem text={result} />
  {/each}
</SearchMenu>
