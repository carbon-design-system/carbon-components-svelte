<script>
  import { ComboBox } from "carbon-components-svelte";

  const items = Array.from({ length: 100 }, (_, i) => ({
    id: i,
    text: `Item ${i + 1}`,
  }));

  let value = "";
  let selectedId = undefined;
</script>

<ComboBox
  virtualize={{ threshold: 200 }}
  labelText="Custom threshold (threshold: 200)"
  placeholder="Filter..."
  {items}
  shouldFilterItem={(item, value) =>
    item.text.toLowerCase().includes(value.toLowerCase())}
  bind:selectedId
  bind:value
/>
