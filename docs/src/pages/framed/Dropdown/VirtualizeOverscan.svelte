<script>
  import { Dropdown } from "carbon-components-svelte";

  const items = Array.from({ length: 10_000 }, (_, i) => ({
    id: i,
    text: `Item ${i + 1}`,
  }));

  let selectedId = 1000;
</script>

<Dropdown
  virtualize={{ overscan: 100 }}
  labelText="High overscan (10,000 items, overscan: 100)"
  {items}
  bind:selectedId
/>
