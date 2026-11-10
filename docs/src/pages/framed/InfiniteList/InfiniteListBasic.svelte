<script>
  import { Box, InfiniteList, Stack, Text } from "carbon-components-svelte";

  const TOTAL = 400;
  const PAGE_SIZE = 20;

  const services = [
    "checkout-api",
    "billing-worker",
    "search-index",
    "auth-gateway",
    "notifications",
  ];
  const summaries = [
    "Elevated 5xx rate",
    "Queue depth above threshold",
    "Certificate expires in 7 days",
    "Replica lag above 30 seconds",
    "Failed health check in eu-de",
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
          service: services[n % services.length],
          summary: summaries[(n * 3) % summaries.length],
        };
      }),
      nextCursor: end < TOTAL ? end : undefined,
      total: TOTAL,
    };
  }
</script>

<InfiniteList {load} aria-label="Incidents" let:item>
  <Box paddingY={4} paddingX={5} border="subtle" borderSide="bottom">
    <Stack gap={1}>
      <Text type="body-compact-02">
        INC-{String(item.id).padStart(4, "0")}: {item.summary}
      </Text>
      <Text type="helper-text-01" color="secondary">{item.service}</Text>
    </Stack>
  </Box>
</InfiniteList>
