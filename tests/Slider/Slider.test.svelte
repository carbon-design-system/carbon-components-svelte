<script lang="ts">
  import { Slider } from "carbon-components-svelte";

  let value = 0;

  export let disabled = false;
  export let invalid = false;
  export let required = false;
  export let minLabel = "";
  export let maxLabel = "";
  export let hideTextInput = false;
  export let fullWidth = false;
  export let min = 0;
  export let max = 100;
  export let step = 1;
</script>

<Slider
  bind:value
  labelText="Test Slider"
  {min}
  {max}
  {step}
  {disabled}
  {invalid}
  {required}
  {minLabel}
  {maxLabel}
  {hideTextInput}
  {fullWidth}
  on:change={(e) => {
    console.log("change", e.detail);
  }}
  on:input={(e) => {
    console.log("input", e.detail);
  }}
/>
