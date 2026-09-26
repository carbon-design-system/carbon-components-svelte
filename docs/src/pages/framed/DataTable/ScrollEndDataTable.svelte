<script>
  import { DataTable, InlineLoading } from "carbon-components-svelte";

  const PAGE_SIZE = 10;
  const TOTAL = 60;

  const headers = [
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
    { key: "port", value: "Port" },
  ];

  let rows = [];
  let loading = false;
  let hasMore = true;

  function makePage(offset) {
    return Array.from(
      { length: Math.min(PAGE_SIZE, TOTAL - offset) },
      (_, i) => {
        const n = offset + i;
        return {
          id: String(n),
          name: `Load Balancer ${n + 1}`,
          protocol: "HTTP",
          port: 3000 + n * 10,
        };
      },
    );
  }

  async function loadMore() {
    if (loading || !hasMore) return;
    loading = true;
    await new Promise((resolve) => setTimeout(resolve, 400));
    rows = [...rows, ...makePage(rows.length)];
    hasMore = rows.length < TOTAL;
    loading = false;
  }

  loadMore();
</script>

<DataTable
  {headers}
  {rows}
  virtualize={{ containerHeight: 240, threshold: 1 }}
  on:scrollend={loadMore}
/>
<div class="scrollend-loading">
  {#if loading}
    <InlineLoading description="Loading more…" />
  {/if}
</div>

<style>
  .scrollend-loading {
    min-height: 2rem;
  }
</style>
