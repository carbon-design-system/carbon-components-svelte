<script lang="ts">
import { Tile } from "carbon-components-svelte";
</script>

<Tile>Default tile</Tile>

<Tile light>Light variant</Tile>

<Tile
  data-testid="click-test"
  on:click={() => {
    console.log("clicked");
  }}
>
  Clickable tile
</Tile>

<Tile data-testid="attr-test" title="Custom title" class="custom-class">
  Custom attributes
</Tile>
