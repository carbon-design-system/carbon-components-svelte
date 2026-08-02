<script>
  import { MultiSelect } from "carbon-components-svelte";

  let selectedIds = [];
</script>

<MultiSelect
  labelText="Cities"
  label="Select cities..."
  bind:selectedIds
  items={[
    { id: "all", text: "All cities", isSelectAll: true },
    { id: "us-ny", text: "New York", group: "United States" },
    { id: "us-sf", text: "San Francisco", group: "United States" },
    { id: "de-be", text: "Berlin", group: "Germany" },
    { id: "de-mu", text: "Munich", group: "Germany" },
    { id: "jp-to", text: "Tokyo", group: "Japan" },
  ]}
/>

<pre>{JSON.stringify(selectedIds, null, 2)}</pre>
