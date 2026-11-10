<script lang="ts">
  import InfiniteList from "carbon-components-svelte/InfiniteList/InfiniteList.svelte";

  export let withInitial = true;
  export let restore = false;
  export let scroll: "window" | "container" = "window";

  const initial = {
    items: [{ id: 1 }, { id: 2 }, { id: 3 }],
    nextCursor: 3,
    total: 4000,
  };

  function load() {
    return Promise.reject(new Error("a server render never loads"));
  }
</script>

<InfiniteList
  {load}
  initial={withInitial ? initial : undefined}
  {restore}
  {scroll}
  mode="auto"
  aria-label="Results"
  let:item
>
  <a href="#row-{item.id}">Row {item.id}</a>
</InfiniteList>
