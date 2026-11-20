<script>
  import {
    Box,
    InfiniteList,
    Link,
    Stack,
    Text,
  } from "carbon-components-svelte";

  const TOTAL = 120;
  const PAGE_SIZE = 10;

  const authors = ["Aisha Khan", "Mateo García", "Priya Patel", "Chen Wei"];
  const updates = [
    "Rolled back the canary. The error rate on checkout-api returned to 0.2% within five minutes.",
    "Added dashboards for p95 latency and queue depth.",
    "The nightly export now runs on the batch queue with a 2 GB worker.",
    "Migrated the search index to the new cluster. No downtime.",
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
          author: authors[n % authors.length],
          body: updates[n % updates.length],
        };
      }),
      nextCursor: end < TOTAL ? end : undefined,
      total: TOTAL,
    };
  }
</script>

<InfiniteList
  {load}
  pattern="feed"
  mode="button"
  aria-label="Team updates"
  let:item
>
  <Box paddingY={4} paddingX={5} border="subtle" borderSide="bottom">
    <Stack gap={2}>
      <Link href="#update-{item.id}">{item.author}</Link>
      <Text>{item.body}</Text>
    </Stack>
  </Box>
</InfiniteList>
