<script lang="ts">
  import RangeSlider from "carbon-components-svelte/Slider/RangeSlider.svelte";

  export let value = 0;
  export let valueUpper = 100;
  export let min = 0;
  export let max = 100;
  export let step = 1;
  export let disabled = false;
  export let readonly = false;
  export let hideTextInput = false;
  export let labelText = "Range";
  export let name = "";
  export let nameUpper = "";
  export let ariaLabelInput: string | undefined = undefined;
  export let ariaLabelInputUpper: string | undefined = undefined;
</script>

<RangeSlider
  bind:value
  bind:valueUpper
  {labelText}
  {min}
  {max}
  {step}
  {disabled}
  {readonly}
  {hideTextInput}
  {name}
  {nameUpper}
  ariaLabelInput={ariaLabelInput ?? "Lower bound"}
  ariaLabelInputUpper={ariaLabelInputUpper ?? "Upper bound"}
  on:change={(e) => {
    console.log("change", e.detail);
  }}
  on:input={(e) => {
    console.log("input", e.detail);
  }}
/>
