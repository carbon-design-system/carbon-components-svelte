<script>
  import { Dropdown, VirtualList } from "carbon-components-svelte";

  const items = Array.from({ length: 2000 }, (_, i) => ({
    id: i,
    text: `Item ${i}`,
  }));

  // Three heights, so measured offsets differ from the estimate.
  const HEIGHTS = [40, 72, 120];
</script>

<div class="lists">
  <VirtualList
    data-testid="default"
    {items}
    itemHeight={40}
    containerHeight={300}
    getKey={(item) => item.id}
    let:item
  >
    <div class="row" style:height="40px">{item.text}</div>
  </VirtualList>

  <VirtualList
    data-testid="optimized"
    optimizeFastScroll
    {items}
    itemHeight={40}
    containerHeight={300}
    getKey={(item) => item.id}
    let:item
  >
    <div class="row" style:height="40px">{item.text}</div>
  </VirtualList>

  <VirtualList
    data-testid="optimized-measured"
    optimizeFastScroll
    measured
    {items}
    itemHeight={40}
    containerHeight={300}
    getKey={(item) => item.id}
    let:item
  >
    <div class="row" style:height="{HEIGHTS[item.id % 3]}px">{item.text}</div>
  </VirtualList>

  <VirtualList
    data-testid="optimized-wide"
    optimizeFastScroll
    {items}
    itemHeight={40}
    containerHeight={300}
    getKey={(item) => item.id}
    let:item
  >
    <div class="row" style:height="40px" style:width="800px">{item.text}</div>
  </VirtualList>
</div>

<div class="dropdown">
  <Dropdown
    titleText="Fast scroll dropdown"
    {items}
    portalMenu={false}
    virtualize={{ optimizeFastScroll: true }}
  />
</div>

<style>
  .lists {
    display: flex;
    gap: 1rem;
  }

  .lists :global(.bx--virtual-list) {
    width: 240px;
  }

  .dropdown {
    width: 320px;
    margin-top: 2rem;
    height: 400px;
  }
</style>
