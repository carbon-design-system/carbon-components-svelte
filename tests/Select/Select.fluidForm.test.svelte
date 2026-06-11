<script lang="ts">
  import FluidForm from "carbon-components-svelte/FluidForm/FluidForm.svelte";
  import Select from "carbon-components-svelte/Select/Select.svelte";
  import SelectItem from "carbon-components-svelte/Select/SelectItem.svelte";
</script>

<FluidForm>
  <Select labelText="Fluid form select">
    <SelectItem value="option-1" text="Option 1" />
    <SelectItem value="option-2" text="Option 2" />
  </Select>
</FluidForm>
