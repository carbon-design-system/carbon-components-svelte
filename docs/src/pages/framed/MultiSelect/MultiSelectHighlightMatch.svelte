<script>
  import {
    fuzzyMatch,
    highlightSegments,
    MultiSelect,
  } from "carbon-components-svelte";

  let value = "";

  const items = [
    { id: "0", text: "Production" },
    { id: "1", text: "Staging" },
    { id: "2", text: "Development" },
    { id: "3", text: "Sandbox" },
    { id: "4", text: "QA" },
    { id: "5", text: "Canary" },
    { id: "6", text: "Preview" },
    { id: "7", text: "Local" },
    { id: "8", text: "Demo" },
    { id: "9", text: "Integration" },
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
  labelText="Environment"
  placeholder="Filter environments..."
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
