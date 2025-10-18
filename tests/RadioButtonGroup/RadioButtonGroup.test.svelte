<svelte:options accessors />

<script lang="ts">
  import { RadioButtonGroup, RadioButton } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let selected: ComponentProps<RadioButtonGroup>["selected"] = undefined;
  export let disabled: ComponentProps<RadioButtonGroup>["disabled"] = false;
  export let required: ComponentProps<RadioButtonGroup>["required"] = undefined;
  export let name: ComponentProps<RadioButtonGroup>["name"] = undefined;
  export let legendText: ComponentProps<RadioButtonGroup>["legendText"] = "";
  export let hideLegend: ComponentProps<RadioButtonGroup>["hideLegend"] = false;
  export let labelPosition: ComponentProps<RadioButtonGroup>["labelPosition"] =
    "right";
  export let orientation: ComponentProps<RadioButtonGroup>["orientation"] =
    "horizontal";
  export let id: ComponentProps<RadioButtonGroup>["id"] = undefined;
  export let helperText: ComponentProps<RadioButtonGroup>["helperText"] = "";
  export let customClass = "";
  export let useSlot = false;
</script>

{#if useSlot}
  <RadioButtonGroup
    bind:selected
    {disabled}
    {required}
    {name}
    {hideLegend}
    {labelPosition}
    {orientation}
    {id}
    {helperText}
    class={customClass}
    on:change={(e) => {
      console.log("change", e.detail);
    }}
  >
    <span slot="legendText">Custom Legend</span>
    <RadioButton labelText="Option 1" value="1" />
    <RadioButton labelText="Option 2" value="2" />
    <RadioButton labelText="Option 3" value="3" />
  </RadioButtonGroup>
{:else}
  <RadioButtonGroup
    bind:selected
    {disabled}
    {required}
    {name}
    {legendText}
    {hideLegend}
    {labelPosition}
    {orientation}
    {id}
    {helperText}
    class={customClass}
    on:change={(e) => {
      console.log("change", e.detail);
    }}
  >
    <RadioButton labelText="Option 1" value="1" />
    <RadioButton labelText="Option 2" value="2" />
    <RadioButton labelText="Option 3" value="3" />
  </RadioButtonGroup>
{/if}
