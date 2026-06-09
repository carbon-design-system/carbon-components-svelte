<svelte:options accessors />

<script lang="ts">
  import SelectableTile from "carbon-components-svelte/Tile/SelectableTile.svelte";
  import SelectableTileGroup from "carbon-components-svelte/Tile/SelectableTileGroup.svelte";
  import type { ComponentProps } from "svelte";

  export let selected: ComponentProps<SelectableTileGroup>["selected"] = [];
  export let disabled: ComponentProps<SelectableTileGroup>["disabled"] = false;
  export let name: ComponentProps<SelectableTileGroup>["name"] = undefined;
  export let legendText: ComponentProps<SelectableTileGroup>["legendText"] = "";
  export let hideLegend: ComponentProps<SelectableTileGroup>["hideLegend"] = false;
  export let customClass = "";
</script>

<SelectableTileGroup
  bind:selected
  {disabled}
  {name}
  {legendText}
  {hideLegend}
  class={customClass}
  on:select={(e) => {
    console.log("select", e.detail);
  }}
  on:deselect={(e) => {
    console.log("deselect", e.detail);
  }}
>
  <SelectableTile value="option1">Option 1</SelectableTile>
  <SelectableTile value="option2">Option 2</SelectableTile>
  <SelectableTile value="option3">Option 3</SelectableTile>
</SelectableTileGroup>
