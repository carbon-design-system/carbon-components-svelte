<svelte:options accessors />

<script lang="ts">
  import SelectableTile from "carbon-components-svelte/Tile/SelectableTile.svelte";
  import SelectableTileGroup from "carbon-components-svelte/Tile/SelectableTileGroup.svelte";
  import type { ComponentProps } from "svelte";

  export let selected: ComponentProps<SelectableTileGroup>["selected"] = [];
  export let disabled: ComponentProps<SelectableTileGroup>["disabled"] = false;
  export let name: ComponentProps<SelectableTileGroup>["name"] = undefined;
  export let form: ComponentProps<SelectableTileGroup>["form"] = undefined;
  export let legendText: ComponentProps<SelectableTileGroup>["legendText"] = "";
  export let hideLegend: ComponentProps<SelectableTileGroup>["hideLegend"] = false;
  export let customClass = "";
  export let onSelect: (detail: string) => void = () => {};
  export let onDeselect: (detail: string) => void = () => {};
  export let onChange: (detail: string[]) => void = () => {};
</script>

<SelectableTileGroup
  bind:selected
  {disabled}
  {name}
  {form}
  {legendText}
  {hideLegend}
  class={customClass}
  on:select={(e) => onSelect(e.detail)}
  on:deselect={(e) => onDeselect(e.detail)}
  on:change={(e) => onChange(e.detail)}
>
  <SelectableTile value="option1">Option 1</SelectableTile>
  <SelectableTile value="option2">Option 2</SelectableTile>
  <SelectableTile value="option3">Option 3</SelectableTile>
</SelectableTileGroup>
