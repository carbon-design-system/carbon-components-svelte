<script>
  import { MultiSelect } from "carbon-components-svelte";

  const items = [
    { id: "0", text: "Frankfurt", group: "Europe" },
    { id: "1", text: "Toronto", group: "Americas" },
    { id: "2", text: "London", group: "Europe" },
    { id: "3", text: "São Paulo", group: "Americas" },
    { id: "4", text: "Mumbai", group: "Asia Pacific" },
    { id: "5", text: "Tokyo", group: "Asia Pacific" },
  ];
</script>

<MultiSelect
  labelText="Regions"
  label="Select regions..."
  {items}
  selectedIds={["0", "2", "5"]}
>
  <svelte:fragment slot="group" let:group let:items={groupItems}>
    {@const selectedCount = groupItems.filter((item) => item.checked).length}
    {group}
    ({selectedCount}/{groupItems.length})
  </svelte:fragment>
</MultiSelect>
