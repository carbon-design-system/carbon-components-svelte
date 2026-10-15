<script lang="ts">
  import RadioTile from "carbon-components-svelte/Tile/RadioTile.svelte";
  import TileGroup from "carbon-components-svelte/Tile/TileGroup.svelte";
</script>

<TileGroup legendText="Rooms" size="sm">
  <RadioTile value="queen">Queen</RadioTile>
  <RadioTile value="king" size="md">King</RadioTile>
</TileGroup>
