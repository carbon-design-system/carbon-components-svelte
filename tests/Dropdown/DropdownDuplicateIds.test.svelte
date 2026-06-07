<script lang="ts">
  import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ];
</script>

<Dropdown {items} id="dropdown-a" labelText="Contact A" open />
<Dropdown {items} id="dropdown-b" labelText="Contact B" open />
