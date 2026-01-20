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
  export let allowDecimal = false;
  export let disabled = false;
  export let hideSteppers = false;
  export let invalid = false;
  export let invalidText = "";
  export let warn = false;
  export let warnText = "";
  export let helperText = "";
  export let labelText = "Clusters";
  export let hideLabel = false;
  export let translateWithId: ComponentProps<NumberInput>["translateWithId"] =
    undefined;
  export let id = "ccs-test";
  export let name: ComponentProps<NumberInput>["name"] = undefined;
  export let ref: ComponentProps<NumberInput>["ref"] = null;
  export let title: ComponentProps<NumberInput>["title"] = undefined;
  export let lang: ComponentProps<NumberInput>["lang"] = undefined;
  export let onchange: ((event: CustomEvent) => void) | undefined = undefined;
  export let oninput: ((event: CustomEvent) => void) | undefined = undefined;
  export let onkeydown: ((event: KeyboardEvent) => void) | undefined =
    undefined;
  export let onkeyup: ((event: KeyboardEvent) => void) | undefined = undefined;
  export let onfocus: ((event: FocusEvent) => void) | undefined = undefined;
  export let onblur: ((event: FocusEvent) => void) | undefined = undefined;
  export let onpaste: ((event: ClipboardEvent) => void) | undefined = undefined;
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
  {allowDecimal}
  {disabled}
  {hideSteppers}
  {invalid}
  {invalidText}
  {warn}
  {warnText}
  {helperText}
  {labelText}
  {hideLabel}
  {translateWithId}
  {id}
  {name}
  {ref}
  {title}
  {lang}
  on:change={onchange}
  on:input={oninput}
  on:keydown={onkeydown}
  on:keyup={onkeyup}
  on:focus={onfocus}
  on:blur={onblur}
  on:paste={onpaste}
/>

<div data-testid="value">{value}</div>
