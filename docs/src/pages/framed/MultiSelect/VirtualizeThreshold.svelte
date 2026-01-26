<script>
  import { MultiSelect } from "carbon-components-svelte";

  const items = Array.from({ length: 100 }, (_, i) => ({
    id: i,
    text: "Item " + (i + 1),
  }));

  let selectedIds = [50];
</script>

<MultiSelect
  virtualize={{ threshold: 200 }}
  labelText="Custom threshold (threshold: 200)"
  {items}
  bind:selectedIds
/>
