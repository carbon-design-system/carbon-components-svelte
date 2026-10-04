<script>
  import { ExpandableTile } from "carbon-components-svelte";
</script>

<ExpandableTile data-testid="expandable-tile">
  <span slot="above" data-testid="above-fold">Above the fold</span>
  <span slot="below" data-testid="below-fold">Below the fold</span>
</ExpandableTile>

<ExpandableTile
  data-testid="interactive-tile"
  hasInteractiveContent
  tileCollapsedLabel="View more"
  tileExpandedLabel="View less"
>
  <a slot="above" href="#details">View details</a>
  <span slot="below">Below the fold</span>
</ExpandableTile>
