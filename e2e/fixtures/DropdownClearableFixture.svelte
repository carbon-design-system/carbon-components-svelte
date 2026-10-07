<script>
  import { Dropdown } from "carbon-components-svelte";

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ];
</script>

<div data-testid="dropdown-clearable">
  <Dropdown labelText="Contact" {items} selectedId="0" clearable />
</div>

<div data-testid="dropdown-clearable-invalid">
  <Dropdown
    labelText="Contact"
    {items}
    selectedId="0"
    clearable
    invalid
    invalidText="This field is required"
  />
</div>

<div data-testid="dropdown-clearable-warning">
  <Dropdown
    labelText="Contact"
    {items}
    selectedId="0"
    clearable
    warn
    warnText="This selection may be incorrect"
  />
</div>

<div data-testid="dropdown-clearable-inline-invalid">
  <Dropdown
    labelText="Contact"
    {items}
    selectedId="0"
    clearable
    inline
    invalid
    invalidText="This field is required"
  />
</div>

<div data-testid="dropdown-clearable-fluid-invalid">
  <Dropdown
    labelText="Contact"
    {items}
    selectedId="0"
    clearable
    fluid
    invalid
    invalidText="This field is required"
  />
</div>

<div data-testid="dropdown-clearable-xs-invalid">
  <Dropdown
    labelText="Contact"
    {items}
    selectedId="0"
    clearable
    size="xs"
    invalid
    invalidText="This field is required"
  />
</div>
