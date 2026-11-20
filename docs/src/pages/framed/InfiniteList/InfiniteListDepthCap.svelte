<script>
  import { Box, InfiniteList, Link, Text } from "carbon-components-svelte";

  const TOTAL = 4000;
  const PAGE_SIZE = 20;

  async function load({ cursor = 0, signal }) {
    // For demo purposes only: a real app fetches a page from its API here.
    await new Promise((resolve) => setTimeout(resolve, 200));
    signal.throwIfAborted();
    const end = Math.min(cursor + PAGE_SIZE, TOTAL);
    return {
      items: Array.from({ length: end - cursor }, (_, i) => ({
        id: cursor + i + 1,
        name: `audit-event-${String(cursor + i + 1).padStart(4, "0")}`,
      })),
      nextCursor: end < TOTAL ? end : undefined,
      total: TOTAL,
    };
  }
</script>

<InfiniteList {load} maxItems={60} aria-label="Audit events" let:item>
  <Box paddingY={3} paddingX={5} border="subtle" borderSide="bottom">
    <Text type="body-compact-01">{item.name}</Text>
  </Box>
  <svelte:fragment slot="cap" let:count let:total>
    <Text type="body-compact-01" color="secondary">
      Showing {count} of {total.toLocaleString("en-US")}.
      <Link href="#filters">Add a filter</Link> to narrow the events.
    </Text>
  </svelte:fragment>
</InfiniteList>
