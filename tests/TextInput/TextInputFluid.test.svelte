<script lang="ts">
  import { FluidForm, TextInput } from "carbon-components-svelte";
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
    labelText="User name"
    {invalid}
    {invalidText}
    {warn}
    {warnText}
    {helperText}
    {inline}
  />
</FluidForm>
