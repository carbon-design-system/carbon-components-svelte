<script lang="ts">
  import { ExpandableTile } from "carbon-components-svelte";
</script>

<!-- Basic expandable tile (no interactive content) -->
<ExpandableTile data-testid="basic">
  <div slot="above">Above the fold</div>
  <div slot="below">Below the fold</div>
</ExpandableTile>

<!-- Expandable tile with interactive content (link) in "above" slot -->
<ExpandableTile data-testid="interactive" hasInteractiveContent>
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
