<script lang="ts">
  import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";

  export let selectedIds = ["1"];

  let selectionRef: null | HTMLDivElement = null;
</script>

<MultiSelect
  bind:selectedIds
  bind:selectionRef
  labelText="Fruits"
  items={[
    { id: "1", text: "Apple" },
    { id: "2", text: "Banana" },
  ]}
/>

<div data-testid="selection-ref">
  {selectionRef?.isConnected ? "connected" : String(selectionRef)}
</div>
