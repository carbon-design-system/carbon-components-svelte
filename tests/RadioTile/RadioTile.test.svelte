<script lang="ts">
  import RadioTile from "carbon-components-svelte/Tile/RadioTile.svelte";
  import TileGroup from "carbon-components-svelte/Tile/TileGroup.svelte";
  import type { ComponentProps } from "svelte";

  export let checked: ComponentProps<RadioTile>["checked"] = false;
  export let light: ComponentProps<RadioTile>["light"] = false;
  export let disabled: ComponentProps<RadioTile>["disabled"] = false;
  export let required: ComponentProps<RadioTile>["required"] = false;
  export let value: ComponentProps<RadioTile>["value"] = "test";
  export let tabindex: ComponentProps<RadioTile>["tabindex"] = "0";
  export let iconDescription: ComponentProps<RadioTile>["iconDescription"] =
    "Tile checkmark";
  export let id: ComponentProps<RadioTile>["id"] = "ccs-test";
  export let name: ComponentProps<RadioTile>["name"] = "test-group";
  export let onMouseover: (e: MouseEvent) => void = () => {};
  export let onMouseenter: (e: MouseEvent) => void = () => {};
  export let onMouseleave: (e: MouseEvent) => void = () => {};
</script>

<TileGroup
  legendText="Test group"
  name="test-group"
  selected={checked ? value : undefined}
>
  <RadioTile
    {checked}
    {light}
    {disabled}
    {required}
    {value}
    {tabindex}
    {iconDescription}
    {id}
    {name}
    on:change={() => {
      console.log("change");
    }}
    on:keydown
    on:click
    on:mouseover={onMouseover}
    on:mouseenter={onMouseenter}
    on:mouseleave={onMouseleave}
  >
    Test content
  </RadioTile>
</TileGroup>
