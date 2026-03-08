<script>
  import { ClickableTile } from "carbon-components-svelte";

  let clicked = false;
</script>

<ClickableTile data-testid="clickable-tile" bind:clicked>
  Clickable tile content
</ClickableTile>
<div data-testid="clicked-state">{clicked}</div>
