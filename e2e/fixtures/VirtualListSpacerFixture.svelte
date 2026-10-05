<script>
  import {
    ContainedList,
    ContainedListItem,
    ListItem,
    UnorderedList,
    VirtualList,
  } from "carbon-components-svelte";

  // Long enough to wrap in a narrow viewport, so rows outgrow `itemHeight`.
  const findings = Array.from({ length: 3000 }, (_, i) => ({
    id: i,
    label: `Finding ${i + 1}: billing-worker grants write access it never uses`,
  }));

  const instances = Array.from({ length: 5000 }, (_, i) => ({
    id: i,
    name: `web-prod-${String(i + 1).padStart(4, "0")} (us-south)`,
  }));

  let listScroller = null;
  let containedScroller = null;
</script>

<div
  data-testid="unordered-scroller"
  bind:this={listScroller}
  style="height: 240px; overflow-y: auto; padding-left: 1.5rem"
>
  <UnorderedList>
    <VirtualList
      items={findings}
      itemHeight={20}
      containerHeight={240}
      scrollElement={listScroller}
      spacerTag="li"
      measured
      getKey={(item) => item.id}
      let:item
    >
      <ListItem>{item.label}</ListItem>
    </VirtualList>
  </UnorderedList>
</div>

<div
  data-testid="contained-scroller"
  bind:this={containedScroller}
  style="height: 240px; overflow-y: auto"
>
  <ContainedList labelText="Instances">
    <VirtualList
      items={instances}
      itemHeight={47}
      containerHeight={240}
      scrollElement={containedScroller}
      spacerTag="li"
      measured
      getKey={(item) => item.id}
      let:item
    >
      <ContainedListItem>{item.name}</ContainedListItem>
    </VirtualList>
  </ContainedList>
</div>
