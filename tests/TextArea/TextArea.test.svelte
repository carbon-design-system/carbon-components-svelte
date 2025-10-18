<script lang="ts">
  import { TextArea } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let value: ComponentProps<TextArea>["value"] = "";
  export let placeholder = "";
  export let cols: ComponentProps<TextArea>["cols"] = undefined;
  export let rows = 4;
  export let maxCount: ComponentProps<TextArea>["maxCount"] = undefined;
  export let light = false;
  export let disabled = false;
  export let readonly = false;
  export let helperText = "";
  export let labelText = "App description";
  export let hideLabel = false;
  export let invalid = false;
  export let invalidText = "";
  export let id = "ccs-test";
  export let name: ComponentProps<TextArea>["name"] = undefined;
  export let ref: ComponentProps<TextArea>["ref"] = null;
</script>

<TextArea
  bind:value
  {placeholder}
  {cols}
  {rows}
  {maxCount}
  {light}
  {disabled}
  {readonly}
  {helperText}
  {labelText}
  {hideLabel}
  {invalid}
  {invalidText}
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
