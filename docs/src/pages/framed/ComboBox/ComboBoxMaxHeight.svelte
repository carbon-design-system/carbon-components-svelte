<script>
  import { ComboBox } from "carbon-components-svelte";

  const items = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    text: `Item ${i + 1}`,
  }));

  let value = "";
  let selectedId = undefined;
</script>

<ComboBox
  portalMenu
  maxHeight={150}
  labelText="Contact method"
  placeholder="Select contact method"
  {items}
  bind:selectedId
  bind:value
/>
