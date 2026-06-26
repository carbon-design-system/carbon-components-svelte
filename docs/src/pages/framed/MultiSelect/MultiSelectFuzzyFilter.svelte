<script>
  import { fuzzyMatch, MultiSelect } from "carbon-components-svelte";

  // Reuse the built-in fuzzy matcher as the filter predicate. Each typed
  // character must appear in order within the item text, so "bl" matches
  // "Blueberry" and "Blackberry". Only the `matched` boolean is used here.
  const filterItem = (item, value) => fuzzyMatch(item.text, value).matched;
</script>

<MultiSelect
  filterable
  {filterItem}
  labelText="Item"
  placeholder="Filter items..."
  items={[
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
  ]}
/>
