<script lang="ts">
  import ClickableTile from "carbon-components-svelte/Tile/ClickableTile.svelte";
  import Tile from "carbon-components-svelte/Tile/Tile.svelte";
</script>

<Tile noPadding data-testid="tile">No padding tile</Tile>

<ClickableTile noPadding href="/details" data-testid="clickable-tile"
  >No padding clickable tile</ClickableTile
>
