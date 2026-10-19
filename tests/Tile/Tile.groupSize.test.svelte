<script lang="ts">
  import RadioTile from "carbon-components-svelte/Tile/RadioTile.svelte";
  import SelectableTile from "carbon-components-svelte/Tile/SelectableTile.svelte";
  import SelectableTileGroup from "carbon-components-svelte/Tile/SelectableTileGroup.svelte";
  import TileGroup from "carbon-components-svelte/Tile/TileGroup.svelte";
  import type { ComponentProps } from "svelte";

  export let size: ComponentProps<TileGroup>["size"] = undefined;
</script>

<SelectableTileGroup legendText="Regions" {size}>
  <SelectableTile value="inherits">Selectable inherits</SelectableTile>
  <SelectableTile value="own" size="md">Selectable own</SelectableTile>
</SelectableTileGroup>

<TileGroup legendText="Rooms" {size}>
  <RadioTile value="inherits">Radio inherits</RadioTile>
  <RadioTile value="own" size="md">Radio own</RadioTile>
</TileGroup>
