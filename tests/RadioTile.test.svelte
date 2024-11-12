<script lang="ts">
  import { TileGroup, RadioTile } from "carbon-components-svelte";
</script>

<TileGroup
  name="plan"
  required
  legend="Service pricing tiers"
  selected="0"
  on:select={(e) => {
    console.log(e.detail); // string
  }}
>
  <RadioTile light checked value="0">Lite plan</RadioTile>
  <RadioTile value="1">Standard plan</RadioTile>
  <RadioTile value="2">Plus plan</RadioTile>
</TileGroup>
