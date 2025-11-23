<script>
  import { ComboBox } from "carbon-components-svelte";

  // Generate large dataset
  const items = Array.from({ length: 5000 }, (_, i) => ({
    id: String(i),
    text: "Item " + (i + 1),
  }));

  let selectedId = undefined;
  let value = "";
</script>

<ComboBox
  titleText="Virtualized ComboBox (5,000 items)"
  placeholder="Filter..."
  helperText="Only visible items are rendered in the DOM"
  {items}
  shouldFilterItem={(item, value) =>
    item.text.toLowerCase().includes(value.toLowerCase())}
  bind:selectedId
  bind:value
  virtualize={true}
/>

<div style="margin-top: 1rem;">
  {#if selectedId !== undefined}
    <strong>Selected:</strong>
    {items.find((item) => item.id === selectedId)?.text}
  {/if}
</div>
