<script lang="ts">
  import FluidForm from "carbon-components-svelte/FluidForm/FluidForm.svelte";
  import PasswordInput from "carbon-components-svelte/TextInput/PasswordInput.svelte";
  import type { ComponentProps } from "svelte";

  export let value: ComponentProps<PasswordInput>["value"] = "";
  export let invalid = false;
  export let invalidText = "";
  export let warn = false;
  export let warnText = "";
  export let helperText = "";
  export let inline = false;
</script>

<FluidForm>
  <PasswordInput
    bind:value
    id="fluid-form-password"
    labelText="Fluid form password"
    {invalid}
    {invalidText}
    {warn}
    {warnText}
    {helperText}
    {inline}
  />
</FluidForm>
