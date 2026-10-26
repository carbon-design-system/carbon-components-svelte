<script>
  import {
    ComboBox,
    fuzzyMatch,
    highlightSegments,
  } from "carbon-components-svelte";

  let value = "";

  const items = [
    { id: "0", text: "Accounting" },
    { id: "1", text: "Accounts Payable" },
    { id: "2", text: "Billing" },
    { id: "3", text: "Business Development" },
    { id: "4", text: "Business Intelligence" },
    { id: "5", text: "Customer Success" },
    { id: "6", text: "Customer Support" },
    { id: "7", text: "Engineering" },
    { id: "8", text: "Marketing" },
    { id: "9", text: "Product" },
  ];

  // One matcher drives filtering and highlighting. `shouldFilterItem` keeps
  // the items whose text fuzzy-matches the typed value; the default slot
  // reuses the same match and bolds the characters that matched. Bind `value`
  // to read the typed query inside the slot.
  const shouldFilterItem = (item, value) =>
    fuzzyMatch(item.text, value).matched;
</script>

<ComboBox
  bind:value
  labelText="Department"
  placeholder="Search for a department"
  {shouldFilterItem}
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
</ComboBox>
