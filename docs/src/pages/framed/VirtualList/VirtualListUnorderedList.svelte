<script>
  import {
    Box,
    ListItem,
    ScrollGradient,
    UnorderedList,
    VirtualList,
  } from "carbon-components-svelte";

  const services = ["checkout-api", "billing-worker", "search-indexer"];
  const findings = [
    "uses a key older than 90 days",
    "grants write access it never uses",
    "has no owner on call",
    "logs request bodies",
  ];

  const items = Array.from({ length: 3000 }, (_, i) => ({
    id: i,
    label: `${services[i % services.length]} ${findings[i % findings.length]}`,
  }));

  let scrollElementRef = null;
</script>

<ScrollGradient height="240px" bind:scrollElementRef>
  <Box paddingY={4} paddingRight={5} paddingLeft={6}>
    <UnorderedList>
      <VirtualList
        {items}
        itemHeight={20}
        containerHeight={240}
        scrollElement={scrollElementRef}
        spacerTag="li"
        measured
        getKey={(item) => item.id}
        let:item
      >
        <ListItem>{item.label}</ListItem>
      </VirtualList>
    </UnorderedList>
  </Box>
</ScrollGradient>
