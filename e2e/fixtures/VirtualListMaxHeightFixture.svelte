<script>
  import { VirtualList } from "carbon-components-svelte";

  // `?rows=` and `?itemHeight=` size the list. The default is taller than
  // Firefox scrolls, about 17.9 million pixels.
  const params = new URLSearchParams(location.search);
  const rows = Number(params.get("rows") ?? 1_000_000);
  const itemHeight = Number(params.get("itemHeight") ?? 24);

  const items = Array.from({ length: rows }, (_, id) => ({ id }));
</script>

<div style="max-width: 24rem">
  <VirtualList
    data-testid="list"
    {items}
    {itemHeight}
    containerHeight={240}
    getKey={(item) => item.id}
    let:item
  >
    <div data-row={item.id} style="height: {itemHeight}px">Row {item.id}</div>
  </VirtualList>
</div>
