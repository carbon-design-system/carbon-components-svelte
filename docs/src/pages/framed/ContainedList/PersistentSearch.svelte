<script>
  import {
    ContainedList,
    ContainedListItem,
    Search,
  } from "carbon-components-svelte";

  let searchTerm = "";
  let searchResults = Array.from(
    { length: 50 },
    (_, i) => "List item " + (i + 1),
  );

  $: filteredResults = searchResults.filter((item) => {
    const lowerItem = item.toLowerCase();
    const lowerSearch = searchTerm.toLowerCase();
    return lowerItem.includes(lowerSearch);
  });
</script>

<ContainedList kind="disclosed" labelText="List title">
  <Search placeholder="Filterable search" bind:value={searchTerm} />
  {#each filteredResults as item}
    <ContainedListItem>{item}</ContainedListItem>
  {/each}
</ContainedList>
