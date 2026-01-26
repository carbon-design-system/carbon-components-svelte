<script>
  import { Dropdown, Stack } from "carbon-components-svelte";

  const items = Array.from({ length: 10_000 }, (_, i) => ({
    id: i,
    text: "Item " + (i + 1),
  }));

  let selectedId = 1000;
  $: selectedItem = items.find((item) => item.id === selectedId);
</script>

<Stack gap={5}>
  <Dropdown
    virtualize
    labelText="Virtualized Dropdown (10,000 items)"
    {items}
    bind:selectedId
  />
  <div>
    <strong>Selected:</strong>
    {selectedItem?.text}
  </div>
</Stack>
