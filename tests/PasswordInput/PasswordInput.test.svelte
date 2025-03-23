<script lang="ts">
import { PasswordInput } from "carbon-components-svelte";

export let size: "sm" | "xl" | undefined = undefined;
export let value: string | number = "";
export let type: "text" | "password" = "password";
export let placeholder = "";
export let hidePasswordLabel = "Hide password";
export let showPasswordLabel = "Show password";
export let tooltipAlignment: "start" | "center" | "end" = "center";
export let tooltipPosition: "top" | "right" | "bottom" | "left" = "bottom";
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
export let ref: HTMLInputElement | null = null;
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
