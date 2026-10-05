<script>
  import { MultiSelect } from "carbon-components-svelte";

  const items = Array.from({ length: 10_000 }, (_, i) => ({
    id: i,
    text: `SKU-${i + 1}`,
  }));

  let selectedIds = [1000];
</script>

<MultiSelect
  virtualize={{ optimizeFastScroll: true }}
  filterable
  labelText="Optimized for fast scrolling (10,000 items)"
  {items}
  bind:selectedIds
/>
