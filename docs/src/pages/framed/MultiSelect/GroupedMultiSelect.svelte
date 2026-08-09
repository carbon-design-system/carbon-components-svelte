<script>
  import { MultiSelect } from "carbon-components-svelte";

  const items = [
    { id: "us-ny", text: "New York", group: "United States" },
    { id: "us-sf", text: "San Francisco", group: "United States" },
    { id: "us-au", text: "Austin", group: "United States" },
    { id: "de-be", text: "Berlin", group: "Germany" },
    { id: "de-mu", text: "Munich", group: "Germany" },
    { id: "jp-to", text: "Tokyo", group: "Japan" },
    { id: "jp-os", text: "Osaka", group: "Japan" },
  ];

  let selectedIds = ["us-ny", "de-be", "de-mu"];

  // Aggregate the bound selectedIds back into groups for display or submission.
  $: itemsById = new Map(items.map((item) => [item.id, item]));
  $: selectedByGroup = selectedIds.reduce((groups, id) => {
    const item = itemsById.get(id);
    if (item) {
      groups[item.group] ??= [];
      groups[item.group].push(item.text);
    }
    return groups;
  }, {});
</script>

<MultiSelect
  labelText="Cities"
  label="Select cities..."
  {items}
  bind:selectedIds
/>

<pre>{JSON.stringify(selectedByGroup, null, 2)}</pre>
