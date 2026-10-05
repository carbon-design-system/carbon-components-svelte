<script>
  import { Dropdown } from "carbon-components-svelte";

  const items = Array.from({ length: 10_000 }, (_, i) => ({
    id: i,
    text: `Ticket #${10000 + i}`,
  }));

  let selectedId = 1000;
</script>

<Dropdown
  virtualize={{ optimizeFastScroll: true }}
  labelText="Optimized for fast scrolling (10,000 support tickets)"
  {items}
  bind:selectedId
/>
