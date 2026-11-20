<script>
  import { Box, InfiniteList, Text } from "carbon-components-svelte";

  const TOTAL = 600;
  const PAGE_SIZE = 25;

  const regions = ["us-south", "us-east", "eu-de", "eu-gb", "jp-tok", "au-syd"];

  async function load({ cursor = 0, signal }) {
    // For demo purposes only: a real app fetches a page from its API here.
    await new Promise((resolve) => setTimeout(resolve, 300));
    signal.throwIfAborted();
    const end = Math.min(cursor + PAGE_SIZE, TOTAL);
    return {
      items: Array.from({ length: end - cursor }, (_, i) => ({
        id: cursor + i + 1,
        name: `web-prod-${String(cursor + i + 1).padStart(4, "0")}`,
        region: regions[(cursor + i) % regions.length],
      })),
      nextCursor: end < TOTAL ? end : undefined,
      total: TOTAL,
    };
  }
</script>

<InfiniteList
  {load}
  mode="auto"
  scroll="container"
  height="20rem"
  aria-label="Instances"
  let:item
>
  <Box
    display="flex"
    align="center"
    justify="space-between"
    paddingY={3}
    paddingX={5}
    border="subtle"
    borderSide="bottom"
  >
    <Text type="body-compact-01">{item.name}</Text>
    <Text type="helper-text-01" color="secondary">{item.region}</Text>
  </Box>
</InfiniteList>
