<script>
  import { ComboBox, Stack } from "carbon-components-svelte";

  const items = Array.from({ length: 10_000 }, (_, i) => ({
    id: i,
    text: `Item ${i + 1}`,
    description: `Description for item ${i + 1}`,
  }));

  let value = "";
  let selectedId = undefined;
</script>

<ComboBox
  virtualize={{ itemHeight: 60 }}
  labelText="Custom item height (60px)"
  placeholder="Filter..."
  {items}
  shouldFilterItem={(item, value) =>
    item.text.toLowerCase().includes(value.toLowerCase())}
  bind:selectedId
  bind:value
  let:item
>
  <Stack gap={2}>
    <strong>{item.text}</strong>
    <span>{item.description}</span>
  </Stack>
</ComboBox>

