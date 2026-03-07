<script>
  import { ExpandableTile } from "carbon-components-svelte";
</script>

<ExpandableTile data-testid="expandable-tile">
  <span slot="above" data-testid="above-fold">Above the fold</span>
  <span slot="below" data-testid="below-fold">Below the fold</span>
</ExpandableTile>
