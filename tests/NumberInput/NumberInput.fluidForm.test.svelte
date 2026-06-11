<script lang="ts">
  import FluidForm from "carbon-components-svelte/FluidForm/FluidForm.svelte";
  import NumberInput from "carbon-components-svelte/NumberInput/NumberInput.svelte";
  import type { ComponentProps } from "svelte";

  export let value: ComponentProps<NumberInput>["value"] = 0;
  export let invalid = false;
  export let invalidText = "";
  export let warn = false;
  export let warnText = "";
  export let helperText = "";
</script>

<FluidForm>
  <NumberInput
    bind:value
    id="fluid-form-input"
    labelText="Fluid form clusters"
    {invalid}
    {invalidText}
    {warn}
    {warnText}
    {helperText}
  />
</FluidForm>
