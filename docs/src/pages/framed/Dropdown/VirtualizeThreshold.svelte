<script>
  import { Dropdown } from "carbon-components-svelte";

  const items = Array.from({ length: 100 }, (_, i) => ({
    id: i,
    text: "Item " + (i + 1),
  }));

  let selectedId = 50;
</script>

<Dropdown
  virtualize={{ threshold: 200 }}
  labelText="Custom threshold (threshold: 200)"
  {items}
  bind:selectedId
/>
