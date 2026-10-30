<svelte:options accessors />

<script lang="ts">
  import ColorPicker from "carbon-components-svelte/ColorPicker/ColorPicker.svelte";
  import type { ComponentProps } from "svelte";

  export let value = "#0f62fe";
  export let format: ComponentProps<ColorPicker>["format"] = "hex";
  export let alpha = false;
  export let swatches: ComponentProps<ColorPicker>["swatches"] = [];
  export let recent: string[] = [];
  export let recentLimit = 8;
  export let background: string | undefined = undefined;
  export let minContrast = 4.5;
  export let hideInputs = false;
  export let hideEyeDropper = false;
  export let swatchColumns = 8;
  export let disabled = false;
  export let readonly = false;
  export let inputs: string[] = [];
  export let changes: string[] = [];
  export let formats: string[] = [];
  export let recentChanges: number[] = [];
</script>

<ColorPicker
  bind:value
  bind:format
  bind:recent
  {alpha}
  {swatches}
  {recentLimit}
  {background}
  {minContrast}
  {hideInputs}
  {hideEyeDropper}
  {swatchColumns}
  {disabled}
  {readonly}
  on:input={(event) => (inputs = [...inputs, event.detail.value])}
  on:change={(event) => (changes = [...changes, event.detail.value])}
  on:format:change={(event) => (formats = [...formats, event.detail.format])}
  on:recent:change={(event) =>
    (recentChanges = [...recentChanges, event.detail.recent.length])}
/>
<span data-testid="value">{value}</span>
<span data-testid="format">{format}</span>
<span data-testid="recent">{recent.join(" ")}</span>
