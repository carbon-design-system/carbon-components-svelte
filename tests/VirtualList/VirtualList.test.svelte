<script lang="ts">
  import VirtualList from "carbon-components-svelte/VirtualList/VirtualList.svelte";

  const items = Array.from({ length: 500 }, (_, i) => ({
    id: i,
    label: `Item ${i}`,
  }));
  const shortItems = items.slice(0, 20);

  let scrollendCount = 0;
  let scrollendDetail = "";
  let scroller: HTMLDivElement | null = null;
</script>

<VirtualList
  data-testid="large"
  {items}
  itemHeight={40}
  containerHeight={200}
  getKey={(item) => item.id}
  on:scrollend={(e) => {
    scrollendCount += 1;
    scrollendDetail = JSON.stringify(e.detail);
  }}
  let:item
  let:index
>
  <div data-testid="row-{index}">{item.label}</div>
</VirtualList>

<VirtualList
  items={shortItems}
  itemHeight={40}
  containerHeight={200}
  let:item
  let:index
>
  <div data-testid="short-row-{index}">{item.label}</div>
</VirtualList>

<VirtualList
  items={shortItems}
  itemHeight={40}
  containerHeight={200}
  threshold={100}
  let:item
  let:index
>
  <div data-testid="unwindowed-row-{index}">{item.label}</div>
</VirtualList>

<div data-testid="scroller" bind:this={scroller} style:height="200px">
  <VirtualList
    data-testid="external"
    {items}
    itemHeight={40}
    containerHeight={200}
    scrollElement={scroller}
    let:item
    let:index
  >
    <div data-testid="external-row-{index}">{item.label}</div>
  </VirtualList>
</div>

<div data-testid="scrollend-count">{scrollendCount}</div>
<div data-testid="scrollend-detail">{scrollendDetail}</div>
