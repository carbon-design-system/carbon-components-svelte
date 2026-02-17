<script>
  import { ComboBox, Stack } from "carbon-components-svelte";

  const items = Array.from({ length: 10_000 }, (_, i) => ({
    id: i,
    text: `Item ${i + 1}`,
  }));

  let value = "";
  let selectedId = undefined;
  $: selectedItem = items.find((item) => item.id === selectedId);
</script>

<Stack gap={5}>
  <ComboBox
    labelText="Virtualized ComboBox (10,000 items)"
    placeholder="Filter..."
    {items}
    shouldFilterItem={(item, value) =>
      item.text.toLowerCase().includes(value.toLowerCase())}
    bind:selectedId
    bind:value
  />
  <div>
    <strong>Selected:</strong>
    {selectedItem?.text}
  </div>
</Stack>
