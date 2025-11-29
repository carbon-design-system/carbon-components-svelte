<svelte:options accessors />

<script lang="ts">
  import {
    SelectableTile,
    SelectableTileGroup,
  } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let selected: ComponentProps<SelectableTileGroup>["selected"] = [];
  export let disabled: ComponentProps<SelectableTileGroup>["disabled"] = false;
  export let name: ComponentProps<SelectableTileGroup>["name"] = undefined;
  export let legend: ComponentProps<SelectableTileGroup>["legend"] = "";
  export let customClass = "";
</script>

<SelectableTileGroup
  bind:selected
  {disabled}
  {name}
  {legend}
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
