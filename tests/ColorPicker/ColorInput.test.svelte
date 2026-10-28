<svelte:options accessors />

<script lang="ts">
  import ColorInput from "carbon-components-svelte/ColorPicker/ColorInput.svelte";
  import type { ComponentProps } from "svelte";

  export let value = "#0f62fe";
  export let format: ComponentProps<ColorInput>["format"] = "hex";
  export let open = false;
  export let alpha = false;
  export let swatches: ComponentProps<ColorInput>["swatches"] = [];
  export let recent: string[] = [];
  export let labelText = "Brand color";
  export let helperText = "";
  export let invalid = false;
  export let invalidText = "";
  export let disabled = false;
  export let readonly = false;
  export let changes: string[] = [];
</script>

<ColorInput
  bind:value
  bind:format
  bind:open
  bind:recent
  {alpha}
  {swatches}
  {labelText}
  {helperText}
  {invalid}
  {invalidText}
  {disabled}
  {readonly}
  on:change={(event) => (changes = [...changes, event.detail])}
/>
<button type="button">After</button>
<span data-testid="value">{value}</span>
<span data-testid="recent">{recent.join(" ")}</span>
