<script>
  import { Dropdown } from "carbon-components-svelte";

  const items = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    text: `Item ${i + 1}`,
  }));

  let selectedId = 42;
</script>

<Dropdown labelText="Items" {items} bind:selectedId />
