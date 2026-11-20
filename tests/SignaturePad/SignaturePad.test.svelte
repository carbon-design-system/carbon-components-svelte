<svelte:options accessors />

<script lang="ts">
  import SignaturePad from "carbon-components-svelte/SignaturePad/SignaturePad.svelte";
  import type { ComponentProps } from "svelte";

  export let value: ComponentProps<SignaturePad>["value"] = null;
  export let mode: ComponentProps<SignaturePad>["mode"] = "draw";
  export let modes: ComponentProps<SignaturePad>["modes"] = ["draw", "type"];
  export let labelText = "Signature";
  export let helperText = "";
  export let invalid = false;
  export let invalidText = "";
  export let warn = false;
  export let warnText = "";
  export let required = false;
  export let disabled = false;
  export let readonly = false;
  export let formats: ComponentProps<SignaturePad>["formats"] = ["svg"];
  export let changes: ComponentProps<SignaturePad>["value"][] = [];
  export let pad: SignaturePad | undefined = undefined;
</script>

<SignaturePad
  bind:this={pad}
  bind:value
  bind:mode
  {modes}
  {labelText}
  {helperText}
  {invalid}
  {invalidText}
  {warn}
  {warnText}
  {required}
  {disabled}
  {readonly}
  {formats}
  on:change={(event) => (changes = [...changes, event.detail])}
/>
<span data-testid="mode">{mode}</span>
<span data-testid="value">{value ? value.type : ""}</span>
