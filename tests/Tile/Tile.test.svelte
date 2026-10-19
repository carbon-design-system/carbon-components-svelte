<script lang="ts">
  import Tile from "carbon-components-svelte/Tile/Tile.svelte";

  export let onClick: (e: MouseEvent) => void = () => {};
</script>

<Tile data-testid="click-test" on:click={onClick}>Clickable tile</Tile>

<Tile data-testid="attr-test" title="Custom title" class="custom-class">
  Custom attributes
</Tile>
