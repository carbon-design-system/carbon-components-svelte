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
</script>

<MultiSelect
  labelText="Cities"
  label="Select cities..."
  {items}
  bind:selectedIds
>
  <svelte:fragment slot="group" let:group let:items>
    {group}
    · {items.filter((item) => item.checked).length} of {items.length} selected
  </svelte:fragment>
</MultiSelect>
