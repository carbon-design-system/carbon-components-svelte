<script lang="ts">
  import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
  import FluidForm from "carbon-components-svelte/FluidForm/FluidForm.svelte";

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
  ];
</script>

<FluidForm>
  <ComboBox
    id="test-combobox"
    {items}
    labelText="Fluid form combobox"
    placeholder="Select contact method"
  />
</FluidForm>
