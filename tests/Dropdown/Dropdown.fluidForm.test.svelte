<script lang="ts">
  import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
  import FluidForm from "carbon-components-svelte/FluidForm/FluidForm.svelte";

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
  ];
</script>

<FluidForm>
  <Dropdown
    id="test-dropdown"
    {items}
    labelText="Fluid form dropdown"
    label="Choose a contact method"
  />
</FluidForm>
