<script>
  import { AILabel, ComboBox, MultiSelect } from "carbon-components-svelte";

  const items = [
    { id: "a", text: "Apple" },
    { id: "b", text: "Banana" },
  ];
</script>

<div style="padding: 1rem; width: 20rem">
  <div data-testid="invalid">
    <MultiSelect
      filterable
      invalid
      invalidText="Select at least one item"
      labelText="Invalid fruits"
      placeholder="Filter fruits"
      {items}
    />
  </div>
  <div data-testid="warn">
    <MultiSelect
      filterable
      warn
      warnText="Pick with care"
      labelText="Warned fruits"
      placeholder="Filter fruits"
      {items}
    />
  </div>
  <div data-testid="decorator">
    <MultiSelect
      filterable
      invalid
      invalidText="Select at least one item"
      labelText="Decorated fruits"
      placeholder="Filter fruits"
      {items}
    >
      <AILabel slot="decorator" />
    </MultiSelect>
  </div>
  <div data-testid="combo">
    <ComboBox
      invalid
      invalidText="Select an item"
      labelText="Combo fruit"
      placeholder="Filter fruits"
      {items}
    />
  </div>
</div>
