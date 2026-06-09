<script lang="ts">
  import RadioTile from "carbon-components-svelte/Tile/RadioTile.svelte";
  import TileGroup from "carbon-components-svelte/Tile/TileGroup.svelte";
</script>

<TileGroup legendText="Test group" name="test-group" selected="test">
  <RadioTile value="test"> <div>Custom content</div> </RadioTile>
</TileGroup>
