<script lang="ts">
  import { RadioTile, TileGroup } from "carbon-components-svelte";
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
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    Test content
  </RadioTile>
</TileGroup>
