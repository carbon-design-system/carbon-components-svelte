<script>
  import { Dropdown } from "carbon-components-svelte";

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ];
</script>

<Dropdown
  data-testid="dropdown-contact"
  labelText="Contact"
  label="Choose an option"
  {items}
/>

<div data-testid="dropdown-fluid-neutral">
  <Dropdown
    fluid
    data-testid="dropdown-fluid-neutral-select"
    labelText="Channel"
    label="Choose a channel"
    {items}
  />
</div>
