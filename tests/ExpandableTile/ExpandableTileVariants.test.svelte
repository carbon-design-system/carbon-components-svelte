<svelte:options accessors />

<script lang="ts">
  import ExpandableTile from "carbon-components-svelte/Tile/ExpandableTile.svelte";

  export let tileMaxHeight = 100;
  export let tilePadding = 50;
</script>

<ExpandableTile data-testid="bound" bind:tileMaxHeight bind:tilePadding>
  <div slot="above">Above bound</div>
  <div slot="below">Below bound</div>
</ExpandableTile>

<!-- Basic expandable tile (no interactive content) -->
<ExpandableTile data-testid="basic">
  <div slot="above">Above the fold</div>
  <div slot="below">Below the fold</div>
</ExpandableTile>

<!-- Expandable tile with interactive content (link) in "above" slot -->
<ExpandableTile
  data-testid="interactive"
  id="interactive-tile"
  hasInteractiveContent
>
  <div slot="above">
    <a href="https://example.com" data-testid="inner-link">Learn more</a>
  </div>
  <div slot="below">Below the fold</div>
</ExpandableTile>

<!-- Pre-expanded tile -->
<ExpandableTile data-testid="pre-expanded" expanded>
  <div slot="above">Above expanded</div>
  <div slot="below">Below expanded</div>
</ExpandableTile>
