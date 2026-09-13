<script>
  import { MultiSelect, Stack } from "carbon-components-svelte";

  const items = Array.from({ length: 10_000 }, (_, i) => ({
    id: i,
    text: `Account ${i + 1}`,
  }));

  let selectedIds = [1000];
  $: selectedItems = items.filter((item) => selectedIds.includes(item.id));
</script>

<Stack gap={5}>
  <MultiSelect
    filterable
    labelText="Customer accounts (10,000)"
    {items}
    bind:selectedIds
  />
  <div>
    <strong>Selected:</strong>
    {selectedItems.map((item) => item.text).join(", ")}
  </div>
</Stack>
