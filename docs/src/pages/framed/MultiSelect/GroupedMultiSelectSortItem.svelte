<script>
  import { MultiSelect } from "carbon-components-svelte";

  let selectedIds = ["us-sf", "de-mu"];

  // `sortItem` runs within each group. Items carry a `checked` flag, so this
  // floats selected items to the top of their group, then sorts alphabetically.
  // selectionFeedback="top" re-sorts on every selection so the order stays live.
  function sortItem(a, b) {
    if (a.checked !== b.checked) return a.checked ? -1 : 1;
    return a.text.localeCompare(b.text);
  }
</script>

<MultiSelect
  labelText="Cities"
  label="Select cities..."
  selectionFeedback="top"
  {sortItem}
  bind:selectedIds
  items={[
    { id: "us-ny", text: "New York", group: "United States" },
    { id: "us-sf", text: "San Francisco", group: "United States" },
    { id: "us-au", text: "Austin", group: "United States" },
    { id: "de-be", text: "Berlin", group: "Germany" },
    { id: "de-mu", text: "Munich", group: "Germany" },
    { id: "de-ha", text: "Hamburg", group: "Germany" },
  ]}
/>
