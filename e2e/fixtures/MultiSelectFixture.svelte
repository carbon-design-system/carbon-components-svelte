<script>
  import { MultiSelect } from "carbon-components-svelte";

  const items = [
    { id: "apple", text: "Apple" },
    { id: "banana", text: "Banana" },
    { id: "cherry", text: "Cherry" },
    { id: "date", text: "Date" },
    { id: "elderberry", text: "Elderberry" },
  ];

  let selectedIds = [];
</script>

<MultiSelect
  data-testid="multiselect-fruits"
  labelText="Fruits"
  label="Choose fruits"
  {items}
  bind:selectedIds
  filterable={true}
  placeholder="Filter fruits"
/>

{#if selectedIds.length > 0}
  <p data-testid="selected-count">Selected: {selectedIds.length}</p>
{/if}
