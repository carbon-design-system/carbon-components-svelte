<script>
  import { ComboBox, MultiSelect } from "carbon-components-svelte";

  const items = [
    { id: "us-east-1", text: "US East (N. Virginia)" },
    { id: "eu-west-1", text: "Europe (Ireland)" },
  ];
</script>

<div data-testid="multiselect-filterable-selected">
  <MultiSelect
    labelText="Regions"
    {items}
    selectedIds={["us-east-1"]}
    filterable
    placeholder="Filter regions"
    invalid
    invalidText="Choose at least two regions"
  />
</div>

<div data-testid="multiselect-filterable-empty">
  <MultiSelect
    labelText="Regions"
    {items}
    filterable
    placeholder="Filter regions"
    invalid
    invalidText="Choose a region"
  />
</div>

<div data-testid="combobox">
  <ComboBox
    labelText="Region"
    {items}
    selectedId="us-east-1"
    invalid
    invalidText="Region is unavailable"
  />
</div>
