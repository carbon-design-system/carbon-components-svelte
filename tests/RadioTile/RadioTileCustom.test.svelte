<script lang="ts">
  import { RadioTile, TileGroup } from "carbon-components-svelte";
</script>

<TileGroup legendText="Test group" name="test-group" selected="test">
  <RadioTile value="test">
    <div>Custom content</div>
  </RadioTile>
</TileGroup>
