<svelte:options accessors />

<script lang="ts">
  import { RadioTile, TileGroup } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let selected: ComponentProps<TileGroup>["selected"] = undefined;
  export let disabled: ComponentProps<TileGroup>["disabled"] = false;
  export let required: ComponentProps<TileGroup>["required"] = undefined;
  export let name: ComponentProps<TileGroup>["name"] = undefined;
  export let legend: ComponentProps<TileGroup>["legend"] = "";
  export let customClass = "";
</script>

<TileGroup
  bind:selected
  {disabled}
  {required}
  {name}
  {legend}
  class={customClass}
  on:select={(e) => {
    console.log("select", e.detail);
  }}
>
  <RadioTile value="option1">Option 1</RadioTile>
  <RadioTile value="option2">Option 2</RadioTile>
  <RadioTile value="option3">Option 3</RadioTile>
</TileGroup>
