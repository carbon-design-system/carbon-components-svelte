<script lang="ts">
  import VirtualList from "carbon-components-svelte/VirtualList/VirtualList.svelte";

  export let items = Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    label: `Row ${i}`,
  }));
  export let follow: "end" | undefined = undefined;
  export let keepMounted: number[] = [];
  export let stickyIndices: number[] = [];
  export let initialScrollTop = 0;
  export let atEnd = true;

  type Row = { id: number; label: string };

  let list: VirtualList<Row> | undefined;

  export function scrollToIndex(
    ...args: Parameters<VirtualList<Row>["scrollToIndex"]>
  ) {
    return list?.scrollToIndex(...args);
  }

  export function scrollToEnd() {
    return list?.scrollToEnd();
  }
</script>

<VirtualList
  data-testid="list"
  bind:this={list}
  bind:atEnd
  {items}
  itemHeight={20}
  containerHeight={100}
  overscan={2}
  {follow}
  {keepMounted}
  {stickyIndices}
  {initialScrollTop}
  getKey={(item) => item.id}
  let:item
  let:index
>
  <div data-testid="row-{index}">{item.label}</div>
</VirtualList>

<div data-testid="at-end">{atEnd}</div>
