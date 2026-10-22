<script>
  import { ComboBox, Dropdown, MultiSelect } from "carbon-components-svelte";

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ];
</script>

<div data-testid="combobox">
  <ComboBox labelText="Contact" {items} selectedId="1" />
</div>

<div data-testid="combobox-invalid">
  <ComboBox
    labelText="Contact"
    {items}
    selectedId="1"
    invalid
    invalidText="This contact method is no longer supported"
  />
</div>

<div data-testid="dropdown">
  <Dropdown labelText="Contact" {items} selectedId="1" />
</div>

<div data-testid="multiselect">
  <MultiSelect labelText="Contact" {items} selectedIds={["1"]} />
</div>
