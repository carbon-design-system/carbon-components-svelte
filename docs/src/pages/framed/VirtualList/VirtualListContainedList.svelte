<script>
  import {
    ContainedList,
    ContainedListItem,
    ScrollGradient,
    VirtualList,
  } from "carbon-components-svelte";

  const regions = ["us-south", "us-east", "eu-de", "eu-gb", "jp-tok", "au-syd"];

  const instances = Array.from({ length: 5000 }, (_, i) => ({
    id: i,
    name: `web-prod-${String(i + 1).padStart(4, "0")}`,
    region: regions[i % regions.length],
  }));

  let scrollElementRef = null;
</script>

<ScrollGradient
  height="240px"
  background="background"
  color="background"
  hideStartGradient
  bind:scrollElementRef
>
  <ContainedList labelText="Instances">
    <VirtualList
      items={instances}
      itemHeight={47}
      containerHeight={240}
      scrollElement={scrollElementRef}
      spacerTag="li"
      measured
      getKey={(item) => item.id}
      let:item
    >
      <ContainedListItem>{item.name} ({item.region})</ContainedListItem>
    </VirtualList>
  </ContainedList>
</ScrollGradient>
