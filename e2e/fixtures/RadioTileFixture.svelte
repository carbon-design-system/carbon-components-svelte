<script>
  import { RadioTile, TileGroup } from "carbon-components-svelte";

  let selected;
</script>

<TileGroup data-testid="radio-tile-group" legendText="Choose one" bind:selected>
  <RadioTile value="a" data-testid="radio-tile-a">Option A</RadioTile>
  <RadioTile value="b" data-testid="radio-tile-b">Option B</RadioTile>
</TileGroup>
<div data-testid="selected-value">{selected ?? "none"}</div>

<div style="width: 320px">
  <TileGroup legendText="Compact" size="sm" name="compact">
    <RadioTile value="c" data-testid="radio-tile-sm" checked>
      Deluxe King with a long name that wraps
    </RadioTile>
  </TileGroup>
</div>
