<script lang="ts">
  import RadioTile from "carbon-components-svelte/Tile/RadioTile.svelte";
  import TileGroup from "carbon-components-svelte/Tile/TileGroup.svelte";
</script>

<TileGroup legendText="First">
  <RadioTile value="a">A</RadioTile>
  <RadioTile value="b">B</RadioTile>
</TileGroup>
<TileGroup legendText="Second">
  <RadioTile value="c">C</RadioTile>
  <RadioTile value="d">D</RadioTile>
</TileGroup>
