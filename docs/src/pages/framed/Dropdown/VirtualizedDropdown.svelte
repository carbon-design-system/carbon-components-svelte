<script>
  import { Dropdown, Stack } from "carbon-components-svelte";

  const items = Array.from({ length: 10_000 }, (_, i) => ({
    id: i,
    text: `Ticket #${10000 + i}`,
  }));

  let selectedId = 1000;
  $: selectedItem = items.find((item) => item.id === selectedId);
</script>

<Stack gap={5}>
  <Dropdown
    labelText="Virtualized dropdown (10,000 support tickets)"
    {items}
    bind:selectedId
  />
  <div>
    <strong>Selected:</strong>
    {selectedItem?.text}
  </div>
</Stack>
