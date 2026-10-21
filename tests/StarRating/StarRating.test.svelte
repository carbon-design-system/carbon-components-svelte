<svelte:options accessors />

<script lang="ts">
  import StarRating from "carbon-components-svelte/StarRating/StarRating.svelte";
  import type { ComponentProps } from "svelte";

  export let value = 0;
  export let max: ComponentProps<StarRating>["max"] = 5;
  export let legendText = "Overall rating";
  export let helperText = "";
  export let invalid = false;
  export let invalidText = "";
  export let warn = false;
  export let warnText = "";
  export let disabled = false;
  export let readonly = false;
  export let allowDeselect = false;
  export let valueText: ComponentProps<StarRating>["valueText"] = undefined;
  export let changes: number[] = [];
</script>

<StarRating
  bind:value
  {max}
  {legendText}
  {helperText}
  {invalid}
  {invalidText}
  {warn}
  {warnText}
  {disabled}
  {readonly}
  {allowDeselect}
  {...valueText ? { valueText } : {}}
  on:change={(event) => (changes = [...changes, event.detail])}
/>
<output data-testid="value">{value}</output>
