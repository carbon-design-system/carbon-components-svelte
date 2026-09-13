<script>
  import { ComboBox, fuzzyMatch } from "carbon-components-svelte";

  let selectedId = undefined;

  // Reuse the built-in fuzzy matcher as the filter predicate. Each typed
  // character must appear in order within the item text, so "acc" matches
  // "Accounting" and "Accounts Payable". Only the `matched` boolean is used here.
  const shouldFilterItem = (item, value) =>
    fuzzyMatch(item.text, value).matched;
</script>

<ComboBox
  labelText="Department"
  placeholder="Select a department"
  bind:selectedId
  typeahead
  autoHighlight="first-match"
  {shouldFilterItem}
  items={[
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
  ]}
/>
