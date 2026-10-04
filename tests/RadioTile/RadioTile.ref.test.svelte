<svelte:options accessors />

<script lang="ts">
  import RadioTile from "carbon-components-svelte/Tile/RadioTile.svelte";
  import TileGroup from "carbon-components-svelte/Tile/TileGroup.svelte";
  import type { ComponentProps } from "svelte";

  export let ref: ComponentProps<RadioTile>["ref"] = undefined;
</script>

<TileGroup legendText="Pick one">
  <RadioTile value="a" bind:ref>A</RadioTile>
</TileGroup>
