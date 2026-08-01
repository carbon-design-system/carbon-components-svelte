<script>
  import { ComboBox, InlineLoading, Stack } from "carbon-components-svelte";

  const PAGE_SIZE = 40;
  const TOTAL = 200;

  let items = [];
  let loading = false;
  let hasMore = true;

  function makePage(offset) {
    return Array.from({ length: PAGE_SIZE }, (_, i) => {
      const n = offset + i;
      return { id: String(n), text: `Item ${n + 1}` };
    }).filter((item) => Number(item.id) < TOTAL);
  }

  async function loadMore() {
    if (loading || !hasMore) return;
    loading = true;
    await new Promise((resolve) => setTimeout(resolve, 400));
    const next = makePage(items.length);
    items = [...items, ...next];
    hasMore = items.length < TOTAL;
    loading = false;
  }

  loadMore();
</script>

<Stack gap={4}>
  <ComboBox
    labelText="Load more on scroll"
    placeholder="Open and scroll to the bottom…"
    {items}
    shouldFilterItem={() => true}
    virtualize={{ containerHeight: 240, threshold: 1 }}
    on:scrollend={loadMore}
  />
  {#if loading}
    <InlineLoading description="Loading more…" />
  {:else if !hasMore}
    <p>Loaded all {TOTAL} items.</p>
  {:else}
    <p>
      {items.length}
      of {TOTAL} loaded. Scroll the menu to fetch the next page.
    </p>
  {/if}
</Stack>
