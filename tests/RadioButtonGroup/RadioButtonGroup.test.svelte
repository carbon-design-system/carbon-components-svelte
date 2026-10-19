<svelte:options accessors />

<script lang="ts">
  import RadioButton from "carbon-components-svelte/RadioButton/RadioButton.svelte";
  import RadioButtonGroup from "carbon-components-svelte/RadioButtonGroup/RadioButtonGroup.svelte";
  import type { ComponentProps } from "svelte";

  export let selected: ComponentProps<RadioButtonGroup>["selected"] = undefined;
  export let disabled: ComponentProps<RadioButtonGroup>["disabled"] = false;
  export let required: ComponentProps<RadioButtonGroup>["required"] = undefined;
  export let name: ComponentProps<RadioButtonGroup>["name"] = undefined;
  export let legendText: ComponentProps<RadioButtonGroup>["legendText"] = "";
  export let labelPosition: ComponentProps<RadioButtonGroup>["labelPosition"] =
    "right";
  export let orientation: ComponentProps<RadioButtonGroup>["orientation"] =
    "horizontal";
  export let id: ComponentProps<RadioButtonGroup>["id"] = undefined;
  export let helperText: ComponentProps<RadioButtonGroup>["helperText"] = "";
  export let invalid: ComponentProps<RadioButtonGroup>["invalid"] = false;
  export let invalidText: ComponentProps<RadioButtonGroup>["invalidText"] = "";
  export let warn: ComponentProps<RadioButtonGroup>["warn"] = false;
  export let warnText: ComponentProps<RadioButtonGroup>["warnText"] = "";
  export let allowDeselect: ComponentProps<RadioButtonGroup>["allowDeselect"] = false;
  export let customClass = "";
  export let useSlot = false;
  export let readonly: ComponentProps<RadioButtonGroup>["readonly"] = false;
  export let readonlyText: ComponentProps<RadioButtonGroup>["readonlyText"] =
    undefined;
  export let onChange: (
    detail: ComponentProps<RadioButtonGroup>["selected"] | null,
  ) => void = () => {};
  export let onRadioChange: () => void = () => {};
</script>

{#if useSlot}
  <RadioButtonGroup
    bind:selected
    {disabled}
    {required}
    {name}
    {labelPosition}
    {orientation}
    {id}
    {helperText}
    {invalid}
    {invalidText}
    {warn}
    {warnText}
    {allowDeselect}
    {readonly}
    {readonlyText}
    class={customClass}
    on:change={(e) => onChange(e.detail)}
  >
    <span slot="legendChildren">Custom Legend</span>
    <RadioButton labelText="Option 1" value="1" />
    <RadioButton labelText="Option 2" value="2" on:change={onRadioChange} />
    <RadioButton labelText="Option 3" value="3" />
  </RadioButtonGroup>
{:else}
  <RadioButtonGroup
    bind:selected
    {disabled}
    {required}
    {name}
    {legendText}
    {labelPosition}
    {orientation}
    {id}
    {helperText}
    {invalid}
    {invalidText}
    {warn}
    {warnText}
    {allowDeselect}
    {readonly}
    {readonlyText}
    class={customClass}
    on:change={(e) => onChange(e.detail)}
  >
    <RadioButton labelText="Option 1" value="1" />
    <RadioButton labelText="Option 2" value="2" on:change={onRadioChange} />
    <RadioButton labelText="Option 3" value="3" />
  </RadioButtonGroup>
{/if}
