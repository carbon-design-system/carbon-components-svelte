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
  export let light = false;
  export let hideLabel = false;
  export let name = "";
  export let inputType = "number";
  export let customClass = "";
  export let useSlot = false;
  export let invalidText = "";
  export let id: string | undefined = undefined;
</script>

{#if useSlot}
  <Slider
    bind:value
    id={id}
    {min}
    {max}
    {step}
    {disabled}
    {invalid}
    {invalidText}
    {required}
    {minLabel}
    {maxLabel}
    {hideTextInput}
    {fullWidth}
    {light}
    {hideLabel}
    {name}
    {inputType}
    class={customClass}
    on:change={(e) => {
      console.log("change", e.detail);
    }}
    on:input={(e) => {
      console.log("input", e.detail);
    }}
  >
    <span slot="labelChildren">Slot Label</span>
  </Slider>
{:else}
  <Slider
    bind:value
    labelText="Test Slider"
    id={id}
    {min}
    {max}
    {step}
    {disabled}
    {invalid}
    {invalidText}
    {required}
    {minLabel}
    {maxLabel}
    {hideTextInput}
    {fullWidth}
    {light}
    {hideLabel}
    {name}
    {inputType}
    class={customClass}
    on:change={(e) => {
      console.log("change", e.detail);
    }}
    on:input={(e) => {
      console.log("input", e.detail);
    }}
  />
{/if}
