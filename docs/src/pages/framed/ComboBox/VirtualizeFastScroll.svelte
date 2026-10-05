<script>
  import { ComboBox } from "carbon-components-svelte";

  const items = Array.from({ length: 10_000 }, (_, i) => ({
    id: i,
    text: `Server ${i + 1}`,
  }));

  let value = "";
  let selectedId = undefined;
</script>

<ComboBox
  virtualize={{ optimizeFastScroll: true }}
  labelText="Optimized for fast scrolling (10,000 items)"
  placeholder="Filter..."
  {items}
  shouldFilterItem={(item, value) =>
    item.text.toLowerCase().includes(value.toLowerCase())}
  bind:selectedId
  bind:value
/>
