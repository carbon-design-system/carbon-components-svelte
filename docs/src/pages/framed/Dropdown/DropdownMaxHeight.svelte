<script>
  import { Dropdown } from "carbon-components-svelte";

  const items = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    text: `Item ${i + 1}`,
  }));
</script>

<Dropdown
  portalMenu
  maxHeight={150}
  labelText="Preferred channel"
  {items}
  selectedId={0}
/>
