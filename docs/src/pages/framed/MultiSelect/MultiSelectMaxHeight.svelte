<script>
  import { MultiSelect } from "carbon-components-svelte";

  const items = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    text: `Item ${i + 1}`,
  }));

  let selectedIds = [];
</script>

<MultiSelect
  portalMenu
  maxHeight={150}
  labelText="Contact methods"
  {items}
  bind:selectedIds
/>
