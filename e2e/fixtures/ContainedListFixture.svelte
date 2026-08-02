<script>
  import {
    ContainedList,
    ContainedListItem,
    Search,
  } from "carbon-components-svelte";

  let clickedItem = null;
</script>

<div data-testid="contained-list">
  <ContainedList labelText="List title">
    <ContainedListItem interactive on:click={() => (clickedItem = "1")}>
      Item 1
    </ContainedListItem>
    <ContainedListItem interactive on:click={() => (clickedItem = "2")}>
      Item 2
    </ContainedListItem>
    <ContainedListItem data-testid="link-item" href="https://example.com">
      Item 3
    </ContainedListItem>
  </ContainedList>
</div>
<div data-testid="clicked-item">{clickedItem ?? "none"}</div>

<div data-testid="search-scroller" style="height: 200px; overflow: auto;">
  <ContainedList labelText="Members">
    <Search slot="search" placeholder="Filter members" />
    {#each Array.from({ length: 30 }, (_, i) => i + 1) as n}
      <ContainedListItem>Member {n}</ContainedListItem>
    {/each}
  </ContainedList>
</div>
