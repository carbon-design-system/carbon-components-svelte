<script lang="ts">
  import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";

  export let fluid = true;

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
  ];
</script>

<Dropdown
  {fluid}
  id="test-dropdown"
  {items}
  labelText="Default label"
  label="Choose a contact method"
>
  <svelte:fragment slot="labelChildren">Custom label content</svelte:fragment>
</Dropdown>
