<script>
  import { fuzzyMatch, MultiSelect } from "carbon-components-svelte";

  // Reuse the built-in fuzzy matcher as the filter predicate. Each typed
  // character must appear in order within the item text, so "pr" matches
  // "Production" and "Preview". Only the `matched` boolean is used here.
  const filterItem = (item, value) => fuzzyMatch(item.text, value).matched;
</script>

<MultiSelect
  filterable
  {filterItem}
  labelText="Environment"
  placeholder="Filter environments..."
  items={[
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
  ]}
/>
