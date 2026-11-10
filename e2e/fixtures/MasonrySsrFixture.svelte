<script>
  import { Masonry, Tile } from "carbon-components-svelte";

  export let native = true;
  export let hideUntilPlaced = false;

  // Uneven heights, so the rows of the plain grid differ from the packed
  // columns and every item has somewhere to move.
  const heights = Array.from({ length: 24 }, (_, i) => 56 + ((i * 53) % 140));
</script>

<Masonry data-testid="masonry" columnWidth="10rem" {native} {hideUntilPlaced}>
  {#each heights as height, i}
    <Tile style="block-size: {height}px">Item {i + 1}</Tile>
  {/each}
</Masonry>
