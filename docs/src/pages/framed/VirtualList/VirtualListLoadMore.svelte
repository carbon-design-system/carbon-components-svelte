<script>
  import {
    Box,
    InlineLoading,
    Stack,
    Text,
    VirtualList,
  } from "carbon-components-svelte";

  const PAGE_SIZE = 20;
  const TOTAL = 60;

  let items = [];
  let loading = false;
  let hasMore = true;

  const actors = ["aisha.khan", "mateo.garcia", "priya.patel", "chen.wei"];
  const actions = [
    "signed in",
    "rotated an API key",
    "updated the IAM policy",
    "deployed checkout-api",
    "exported the billing report",
    "invited a new user",
  ];

  function makePage(offset) {
    return Array.from({ length: PAGE_SIZE }, (_, i) => {
      const n = offset + i;
      return {
        id: n,
        label: `${actors[n % actors.length]} ${actions[n % actions.length]}`,
      };
    });
  }

  async function loadMore() {
    if (loading || !hasMore) return;
    loading = true;
    await new Promise((resolve) => setTimeout(resolve, 400));
    items = [...items, ...makePage(items.length)];
    hasMore = items.length < TOTAL;
    loading = false;
  }

  loadMore();
</script>

<Stack gap={4}>
  <VirtualList
    {items}
    itemHeight={40}
    containerHeight={240}
    getKey={(item) => item.id}
    on:scrollend={loadMore}
    let:item
  >
    <Box
      display="flex"
      align="center"
      height="40px"
      paddingX={5}
      border="subtle"
      borderSide="bottom"
    >
      {item.label}
    </Box>
  </VirtualList>
  <Box display="flex" align="center" minHeight={7}>
    {#if loading}
      <InlineLoading description="Loading more…" />
    {:else if !hasMore}
      <Text type="body-short-01" color="secondary">
        Loaded all {TOTAL} audit events.
      </Text>
    {:else}
      <Text type="body-short-01" color="secondary">
        {items.length}
        of {TOTAL} audit events loaded. Scroll to the bottom to fetch more.
      </Text>
    {/if}
  </Box>
</Stack>
