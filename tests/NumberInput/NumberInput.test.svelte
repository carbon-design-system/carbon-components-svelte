<script lang="ts">
  import { NumberInput } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let value: ComponentProps<NumberInput>["value"] = 0;
  export let step: ComponentProps<NumberInput>["step"] = 1;
  export let min: ComponentProps<NumberInput>["min"] = undefined;
  export let max: ComponentProps<NumberInput>["max"] = undefined;
  export let size: ComponentProps<NumberInput>["size"] = undefined;
  export let light = false;
  export let readonly = false;
  export let allowEmpty = false;
  export let disabled = false;
  export let hideSteppers = false;
  export let iconDescription = "";
  export let invalid = false;
  export let invalidText = "";
  export let warn = false;
  export let warnText = "";
  export let helperText = "";
  export let label = "Clusters";
  export let hideLabel = false;
  export let id = "ccs-test";
  export let name: ComponentProps<NumberInput>["name"] = undefined;
  export let ref: ComponentProps<NumberInput>["ref"] = null;
</script>

<NumberInput
  bind:value
  {step}
  {min}
  {max}
  {size}
  {light}
  {readonly}
  {allowEmpty}
  {disabled}
  {hideSteppers}
  {iconDescription}
  {invalid}
  {invalidText}
  {warn}
  {warnText}
  {helperText}
  {label}
  {hideLabel}
  {id}
  {name}
  {ref}
  on:change
  on:input
  on:keydown
  on:keyup
  on:focus
  on:blur
  on:paste
/>

<div data-testid="value">{value}</div>
