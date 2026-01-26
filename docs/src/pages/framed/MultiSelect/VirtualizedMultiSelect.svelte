<script>
  import { MultiSelect, Stack } from "carbon-components-svelte";

  const items = Array.from({ length: 10_000 }, (_, i) => ({
    id: i,
    text: "Item " + (i + 1),
  }));

  let selectedIds = [1000];
  $: selectedItems = items.filter((item) => selectedIds.includes(item.id));
</script>

<Stack gap={5}>
  <MultiSelect
    virtualize={true}
    labelText="Virtualized MultiSelect (10,000 items)"
    {items}
    bind:selectedIds
  />
  <div>
    <strong>Selected:</strong>
    {selectedItems.map((item) => item.text).join(", ")}
  </div>
</Stack>
