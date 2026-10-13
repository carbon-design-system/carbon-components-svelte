<script>
  import { MultiSelect } from "carbon-components-svelte";

  const items = [
    { id: "a", text: "Apple" },
    { id: "b", text: "Banana" },
  ];
</script>

<div style="padding: 1rem; width: 20rem">
  <MultiSelect
    invalid
    invalidText="Select at least one item"
    labelText="Fruits"
    label="Select fruits"
    {items}
  />
</div>
