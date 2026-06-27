<script>
  import {
    fuzzyMatch,
    highlightSegments,
    MultiSelect,
  } from "carbon-components-svelte";

  let value = "";

  const items = [
    { id: "0", text: "Apple" },
    { id: "1", text: "Apricot" },
    { id: "2", text: "Banana" },
    { id: "3", text: "Blueberry" },
    { id: "4", text: "Blackberry" },
    { id: "5", text: "Cherry" },
    { id: "6", text: "Cranberry" },
    { id: "7", text: "Grape" },
    { id: "8", text: "Mango" },
    { id: "9", text: "Pineapple" },
  ];

  // One matcher drives filtering and highlighting. `filterItem` keeps the
  // items whose text fuzzy-matches the filter value; the default slot reuses
  // the same match and bolds the characters that matched. Bind `value` to read
  // the filter text inside the slot.
  const filterItem = (item, value) => fuzzyMatch(item.text, value).matched;
</script>

<MultiSelect
  bind:value
  filterable
  {filterItem}
  labelText="Item"
  placeholder="Filter items..."
  {items}
  let:item
>
  {#each highlightSegments(item.text, fuzzyMatch(item.text, value).indices) as segment}
    {#if segment.match}
      <strong>{segment.text}</strong>
    {:else}
      {segment.text}
    {/if}
  {/each}
</MultiSelect>
