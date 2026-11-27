<script>
  import { Box, InfiniteList, Text } from "carbon-components-svelte";

  const TOTAL = 80;
  const PAGE_SIZE = 20;

  // The second page fails the first time it is asked for.
  let failed = false;

  async function load({ cursor = 0, signal }) {
    // For demo purposes only: a real app fetches a page from its API here.
    await new Promise((resolve) => setTimeout(resolve, 400));
    signal.throwIfAborted();
    if (cursor === PAGE_SIZE && !failed) {
      failed = true;
      throw new Error("The server did not respond");
    }
    const end = Math.min(cursor + PAGE_SIZE, TOTAL);
    return {
      items: Array.from({ length: end - cursor }, (_, i) => ({
        id: cursor + i + 1,
        name: `deploy-${String(cursor + i + 1).padStart(4, "0")}`,
      })),
      nextCursor: end < TOTAL ? end : undefined,
      total: TOTAL,
    };
  }
</script>

<InfiniteList
  {load}
  errorText="Could not load more deployments."
  aria-label="Deployments"
  let:item
>
  <Box paddingY={3} paddingX={5} border="subtle" borderSide="bottom">
    <Text type="body-compact-01">{item.name}</Text>
  </Box>
</InfiniteList>
