<script>
  import { RadioTile, TileGroup } from "carbon-components-svelte";

  let selected = undefined;
</script>

<div class="fixture-container">
  <TileGroup
    data-testid="radio-tile-group"
    legendText="Choose one"
    bind:selected
  >
    <RadioTile value="a" data-testid="radio-tile-a">Option A</RadioTile>
    <RadioTile value="b" data-testid="radio-tile-b">Option B</RadioTile>
  </TileGroup>
  <div data-testid="selected-value">{selected ?? "none"}</div>
</div>

<style>
  .fixture-container {
    padding: 2rem;
  }
</style>
