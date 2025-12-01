<script lang="ts">
  import { TextInput } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let value: ComponentProps<TextInput>["value"] = "";
  export let placeholder = "";
  export let size: ComponentProps<TextInput>["size"] = undefined;
  export let light = false;
  export let disabled = false;
  export let helperText = "";
  export let labelText = "User name";
  export let hideLabel = false;
  export let invalid = false;
  export let invalidText = "";
  export let warn = false;
  export let warnText = "";
  export let id = "ccs-test";
  export let name: ComponentProps<TextInput>["name"] = undefined;
  export let ref: ComponentProps<TextInput>["ref"] = null;
  export let required = false;
  export let inline = false;
  export let readonly = false;
  export let type: ComponentProps<TextInput>["type"] = "text";
  export let onchange: ((event: CustomEvent) => void) | undefined = undefined;
  export let oninput: ((event: CustomEvent) => void) | undefined = undefined;
  export let onkeydown: ((event: KeyboardEvent) => void) | undefined =
    undefined;
  export let onkeyup: ((event: KeyboardEvent) => void) | undefined = undefined;
  export let onfocus: ((event: FocusEvent) => void) | undefined = undefined;
  export let onblur: ((event: FocusEvent) => void) | undefined = undefined;
  export let onpaste: ((event: ClipboardEvent) => void) | undefined = undefined;
</script>

<TextInput
  bind:value
  {placeholder}
  {size}
  {light}
  {disabled}
  {helperText}
  {labelText}
  {hideLabel}
  {invalid}
  {invalidText}
  {warn}
  {warnText}
  {id}
  {name}
  {ref}
  {required}
  {inline}
  {readonly}
  {type}
  on:change={onchange}
  on:input={oninput}
  on:keydown={onkeydown}
  on:keyup={onkeyup}
  on:focus={onfocus}
  on:blur={onblur}
  on:paste={onpaste}
/>

<div data-testid="value">{value}</div>
