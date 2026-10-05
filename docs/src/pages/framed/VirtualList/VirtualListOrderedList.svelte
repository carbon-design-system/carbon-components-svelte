<script>
  import {
    Box,
    ListItem,
    OrderedList,
    ScrollGradient,
    VirtualList,
  } from "carbon-components-svelte";

  const databases = ["billing", "orders", "inventory", "audit", "sessions"];

  const steps = Array.from({ length: 2000 }, (_, i) => ({
    id: i,
    label: `Back up the ${databases[i % databases.length]} database`,
  }));

  let scrollElementRef = null;
</script>

<ScrollGradient height="240px" bind:scrollElementRef>
  <Box paddingY={4} paddingRight={5} paddingLeft={9}>
    <OrderedList native>
      <VirtualList
        items={steps}
        itemHeight={20}
        containerHeight={240}
        scrollElement={scrollElementRef}
        spacerTag="li"
        measured
        getKey={(item) => item.id}
        let:item
        let:index
      >
        <ListItem value={index + 1}>{item.label}</ListItem>
      </VirtualList>
    </OrderedList>
  </Box>
</ScrollGradient>
