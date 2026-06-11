<script lang="ts">
  import FluidForm from "carbon-components-svelte/FluidForm/FluidForm.svelte";
  import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";
  import type { ComponentProps } from "svelte";

  export let value: ComponentProps<TextInput>["value"] = "";
  export let invalid = false;
  export let invalidText = "";
  export let warn = false;
  export let warnText = "";
  export let helperText = "";
  export let inline = false;
</script>

<FluidForm>
  <TextInput
    bind:value
    id="fluid-form-input"
    labelText="Fluid form user name"
    {invalid}
    {invalidText}
    {warn}
    {warnText}
    {helperText}
    {inline}
  />
</FluidForm>
