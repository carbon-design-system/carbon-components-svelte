<script lang="ts">
  import { PasswordInput } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let size: ComponentProps<PasswordInput>["size"] = undefined;
  export let value: ComponentProps<PasswordInput>["value"] = "";
  export let type: ComponentProps<PasswordInput>["type"] = "password";
  export let placeholder = "";
  export let hidePasswordLabel = "Hide password";
  export let showPasswordLabel = "Show password";
  export let tooltipAlignment: ComponentProps<PasswordInput>["tooltipAlignment"] =
    "center";
  export let tooltipPosition: ComponentProps<PasswordInput>["tooltipPosition"] =
    "bottom";
  export let light = false;
  export let disabled = false;
  export let helperText = "";
  export let labelText = "";
  export let hideLabel = false;
  export let invalid = false;
  export let invalidText = "";
  export let warn = false;
  export let warnText = "";
  export let inline = false;
  export let id = "test-password-input";
  export let name = "";
  export let ref: ComponentProps<PasswordInput>["ref"] = null;
  export let portalTooltip: ComponentProps<PasswordInput>["portalTooltip"] =
    undefined;
</script>

<PasswordInput
  {...$$restProps}
  bind:ref
  {size}
  bind:value
  bind:type
  {placeholder}
  {hidePasswordLabel}
  {showPasswordLabel}
  {tooltipAlignment}
  {tooltipPosition}
  {light}
  {disabled}
  {helperText}
  {labelText}
  {hideLabel}
  {invalid}
  {invalidText}
  {warn}
  {warnText}
  {inline}
  {id}
  {name}
  {portalTooltip}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:change
  on:keydown
  on:keyup
  on:focus={() => {
    console.log("focus");
  }}
  on:blur={() => {
    console.log("blur");
  }}
  on:paste
/>

<div data-testid="value">{value}</div>
