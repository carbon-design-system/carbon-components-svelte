<script lang="ts">
  import { TileGroup, RadioTile } from "../types";
</script>

<TileGroup name="plan" required legend="Service pricing tiers">
  <RadioTile light value="0" checked>Lite plan</RadioTile>
  <RadioTile value="1">Standard plan</RadioTile>
  <RadioTile value="2">Plus plan</RadioTile>
</TileGroup>
