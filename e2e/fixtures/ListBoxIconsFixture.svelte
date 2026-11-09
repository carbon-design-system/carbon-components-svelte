<script>
  import { ComboBox, Dropdown, MultiSelect } from "carbon-components-svelte";
  import Email from "carbon-icons-svelte/lib/Email.svelte";

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

<div data-testid="dropdown-item-icons">
  <Dropdown
    labelText="Contact"
    items={[
      { id: "0", text: "Email", icon: Email },
      { id: "1", text: "Fax" },
    ]}
    selectedId="0"
  />
</div>
