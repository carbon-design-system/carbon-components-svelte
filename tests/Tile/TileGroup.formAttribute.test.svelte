<script lang="ts">
  import RadioTile from "carbon-components-svelte/Tile/RadioTile.svelte";
  import TileGroup from "carbon-components-svelte/Tile/TileGroup.svelte";
</script>

<form id="outer-form" data-testid="form"></form>
<TileGroup form="outer-form" name="tier" selected="b" legendText="Tier">
  <RadioTile value="a">A</RadioTile>
  <RadioTile value="b">B</RadioTile>
</TileGroup>
