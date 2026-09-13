<script>
  import {
    ContainedList,
    ContainedListItem,
    Search,
  } from "carbon-components-svelte";

  let searchTerm = "";
  let searchResults = Array.from(
    { length: 50 },
    (_, i) => `Ticket #${10000 + i}`,
  );

  $: filteredResults = searchResults.filter((item) => {
    const lowerItem = item.toLowerCase();
    const lowerSearch = searchTerm.toLowerCase();
    return lowerItem.includes(lowerSearch);
  });
</script>

<ContainedList kind="disclosed" labelText="Support tickets">
  <Search placeholder="Filter tickets" bind:value={searchTerm} />
  {#each filteredResults as item}
    <ContainedListItem>{item}</ContainedListItem>
  {/each}
</ContainedList>
