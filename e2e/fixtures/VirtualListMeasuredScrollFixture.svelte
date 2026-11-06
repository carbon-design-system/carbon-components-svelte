<script>
  import { VirtualList } from "carbon-components-svelte";

  // Rows are taller than the 40px estimate, and the heights differ, so
  // measuring a row above the reader moves the rows below it.
  const items = Array.from({ length: 2000 }, (_, i) => ({
    id: i,
    height: 60 + (i % 5) * 20,
  }));
</script>

<VirtualList
  data-testid="list"
  {items}
  itemHeight={40}
  containerHeight={300}
  measured
  getKey={(item) => item.id}
  let:item
  let:index
>
  <div class="row" data-row={index} style:height="{item.height}px">
    Row {index + 1}
  </div>
</VirtualList>
