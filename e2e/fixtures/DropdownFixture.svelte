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
