<svelte:options accessors />

<script lang="ts">
  import { Checkbox, CheckboxGroup } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let selected: ComponentProps<CheckboxGroup>["selected"] = [];
  export let disabled: ComponentProps<CheckboxGroup>["disabled"] = false;
  export let required: ComponentProps<CheckboxGroup>["required"] = undefined;
  export let name: ComponentProps<CheckboxGroup>["name"] = undefined;
  export let legendText: ComponentProps<CheckboxGroup>["legendText"] = "";
  export let hideLegend: ComponentProps<CheckboxGroup>["hideLegend"] = false;
  export let helperText: ComponentProps<CheckboxGroup>["helperText"] = "";
  export let id: ComponentProps<CheckboxGroup>["id"] = undefined;
  export let customClass = "";
  export let useSlot = false;
</script>

{#if useSlot}
  <CheckboxGroup
    bind:selected
    {disabled}
    {required}
    {name}
    {hideLegend}
    {id}
    {helperText}
    class={customClass}
    on:change={(e) => {
      console.log("change", e.detail);
    }}
  >
    <span slot="legendChildren">Custom Legend</span>
    <Checkbox value="1" labelText="Option 1" />
    <Checkbox value="2" labelText="Option 2" />
    <Checkbox value="3" labelText="Option 3" />
  </CheckboxGroup>
{:else}
  <CheckboxGroup
    bind:selected
    {disabled}
    {required}
    {name}
    {legendText}
    {hideLegend}
    {id}
    {helperText}
    class={customClass}
    on:change={(e) => {
      console.log("change", e.detail);
    }}
  >
    <Checkbox value="1" labelText="Option 1" />
    <Checkbox value="2" labelText="Option 2" />
    <Checkbox value="3" labelText="Option 3" />
  </CheckboxGroup>
{/if}
