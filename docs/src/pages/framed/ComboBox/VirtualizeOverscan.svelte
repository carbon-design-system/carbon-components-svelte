<script>
  import { ComboBox } from "carbon-components-svelte";

  const items = Array.from({ length: 10_000 }, (_, i) => ({
    id: i,
    text: `Item ${i + 1}`,
  }));

  let value = "";
  let selectedId = undefined;
</script>

<ComboBox
  virtualize={{ overscan: 100 }}
  labelText="High overscan (10,000 items, overscan: 100)"
  placeholder="Filter..."
  {items}
  shouldFilterItem={(item, value) =>
    item.text.toLowerCase().includes(value.toLowerCase())}
  bind:selectedId
  bind:value
/>
