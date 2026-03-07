<script>
  import { ClickableTile } from "carbon-components-svelte";

  let clicked = false;
</script>

<div class="fixture-container">
  <ClickableTile
    data-testid="clickable-tile"
    bind:clicked
  >
    Clickable tile content
  </ClickableTile>
  <div data-testid="clicked-state">{clicked}</div>
</div>

<style>
  .fixture-container {
    padding: 2rem;
  }
</style>
