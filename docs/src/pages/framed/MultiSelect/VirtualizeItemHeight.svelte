<script>
  import { MultiSelect, Stack } from "carbon-components-svelte";

  const items = Array.from({ length: 10_000 }, (_, i) => ({
    id: i,
    text: "Item " + (i + 1),
    description: "Description for item " + (i + 1),
  }));

  let selectedIds = [1000];
</script>

<MultiSelect
  virtualize={{ itemHeight: 60 }}
  labelText="Custom item height (60px)"
  {items}
  bind:selectedIds
  let:item
>
  <Stack gap={2}>
    <strong>{item.text}</strong>
    <span>{item.description}</span>
  </Stack>
</MultiSelect>
