<script lang="ts">
  import ClickableTile from "carbon-components-svelte/Tile/ClickableTile.svelte";
  import RadioTile from "carbon-components-svelte/Tile/RadioTile.svelte";
  import SelectableTile from "carbon-components-svelte/Tile/SelectableTile.svelte";
  import SelectableTileGroup from "carbon-components-svelte/Tile/SelectableTileGroup.svelte";
  import Tile from "carbon-components-svelte/Tile/Tile.svelte";
  import TileGroup from "carbon-components-svelte/Tile/TileGroup.svelte";
</script>

<Tile size="sm" data-testid="tile">Tile</Tile>
<ClickableTile size="sm" href="#a" data-testid="clickable"
  >Clickable</ClickableTile
>

<TileGroup legendText="Rooms" size="sm">
  <RadioTile value="queen">Queen</RadioTile>
  <RadioTile value="king" size="md">King</RadioTile>
</TileGroup>

<SelectableTileGroup legendText="Extras" size="sm">
  <SelectableTile value="breakfast">Breakfast</SelectableTile>
</SelectableTileGroup>

<SelectableTile value="parking">Parking</SelectableTile>
