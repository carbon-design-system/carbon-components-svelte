<script lang="ts">
  import FluidForm from "carbon-components-svelte/FluidForm/FluidForm.svelte";
  import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
  ];
</script>

<FluidForm>
  <MultiSelect
    id="test-multiselect"
    {items}
    labelText="Fluid form multi-select"
    label="Select contact methods..."
  />
</FluidForm>
