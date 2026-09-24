<script lang="ts">
  import RadioTile from "carbon-components-svelte/Tile/RadioTile.svelte";
  import TileGroup from "carbon-components-svelte/Tile/TileGroup.svelte";
  import type { ComponentProps } from "svelte";

  export let selected: ComponentProps<TileGroup>["selected"] = undefined;
  export let onSelect: (event: CustomEvent) => void = () => {};
</script>

<form data-testid="form">
  <TileGroup bind:selected legendText="Pick one" on:select={onSelect}>
    <RadioTile value="a">A</RadioTile>
    <RadioTile value="b">B</RadioTile>
  </TileGroup>
</form>
<p data-testid="bound">{String(selected)}</p>
