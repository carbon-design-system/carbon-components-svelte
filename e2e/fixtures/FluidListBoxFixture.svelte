<script>
  import { Dropdown } from "carbon-components-svelte";

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ];
</script>

<div data-testid="fluid-list-box-neutral">
  <Dropdown fluid labelText="Contact" label="Choose an option" {items} />
</div>

<div data-testid="fluid-list-box-invalid">
  <Dropdown
    fluid
    labelText="Contact"
    label="Choose an option"
    {items}
    invalid
    invalidText="This field is required"
  />
</div>

<div data-testid="fluid-list-box-warning">
  <Dropdown
    fluid
    labelText="Contact"
    label="Choose an option"
    {items}
    warn
    warnText="This selection may be incorrect"
  />
</div>

<div data-testid="fluid-list-box-disabled">
  <Dropdown
    fluid
    labelText="Contact"
    label="Choose an option"
    {items}
    disabled
  />
</div>

<div data-testid="fluid-list-box-readonly">
  <Dropdown
    fluid
    labelText="Contact"
    label="Choose an option"
    {items}
    readonly
  />
</div>
