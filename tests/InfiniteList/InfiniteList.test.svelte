<script lang="ts">
  import InfiniteList from "carbon-components-svelte/InfiniteList/InfiniteList.svelte";

  export let onLoaded: (detail: unknown) => void = () => {};
  export let onError: (detail: unknown) => void = () => {};

  let list: InfiniteList;
</script>

<button type="button" data-testid="reset" on:click={() => list.reset()}>
  Reset
</button>
<InfiniteList
  bind:this={list}
  {...$$restProps}
  on:loaded={(event) => onLoaded(event.detail)}
  on:error={(event) => onError(event.detail)}
  let:item
>
  <a href="#row-{item.id}" data-testid="row-{item.id}">Row {item.id}</a>
</InfiniteList>
