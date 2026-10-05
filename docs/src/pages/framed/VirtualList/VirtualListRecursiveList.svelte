<script>
  import {
    Box,
    ListItem,
    RecursiveList,
    ScrollGradient,
    UnorderedList,
    VirtualList,
  } from "carbon-components-svelte";

  const environments = ["production", "staging", "preview"];

  const services = Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    text: `service-${String(i + 1).padStart(4, "0")}`,
    nodes: environments.slice(0, (i % 3) + 1).map((environment) => ({
      text: environment,
      href: `#service-${i + 1}-${environment}`,
    })),
  }));

  let scrollElementRef = null;
</script>

<ScrollGradient height="240px" bind:scrollElementRef>
  <Box paddingY={4} paddingRight={5} paddingLeft={6}>
    <UnorderedList>
      <VirtualList
        items={services}
        itemHeight={60}
        containerHeight={240}
        scrollElement={scrollElementRef}
        spacerTag="li"
        measured
        getKey={(item) => item.id}
        let:item
      >
        <ListItem>
          {item.text}
          <RecursiveList nodes={item.nodes} nested />
        </ListItem>
      </VirtualList>
    </UnorderedList>
  </Box>
</ScrollGradient>
