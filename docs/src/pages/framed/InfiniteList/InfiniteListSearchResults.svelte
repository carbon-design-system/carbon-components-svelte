<script>
  import {
    Box,
    InfiniteList,
    Link,
    Stack,
    Text,
  } from "carbon-components-svelte";

  const TOTAL = 1240;
  const PAGE_SIZE = 10;

  const topics = [
    "Rotate an API key",
    "Configure a private endpoint",
    "Set up alerts for a service",
    "Restore a backup to a new region",
    "Add a user to an access group",
  ];

  async function load({ cursor = 0, signal }) {
    // For demo purposes only: a real app fetches a page from its API here.
    await new Promise((resolve) => setTimeout(resolve, 400));
    signal.throwIfAborted();
    const end = Math.min(cursor + PAGE_SIZE, TOTAL);
    return {
      items: Array.from({ length: end - cursor }, (_, i) => {
        const n = cursor + i;
        return {
          id: n + 1,
          title: `${topics[n % topics.length]} (${n + 1})`,
          path: `docs/guides/${topics[n % topics.length].toLowerCase().replaceAll(" ", "-")}`,
        };
      }),
      nextCursor: end < TOTAL ? end : undefined,
      total: TOTAL,
    };
  }
</script>

<InfiniteList
  {load}
  mode="auto-then-button"
  autoPages={2}
  aria-label="Search results for access"
  let:item
>
  <Box paddingY={4} paddingX={5} border="subtle" borderSide="bottom">
    <Stack gap={1}>
      <Link href="#{item.path}">{item.title}</Link>
      <Text type="helper-text-01" color="secondary">{item.path}</Text>
    </Stack>
  </Box>
</InfiniteList>
