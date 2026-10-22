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

<!-- No `hasInteractiveContent`: the tile finds the link itself. -->
<ExpandableTile
  data-testid="detected-tile"
  tileCollapsedLabel="Show billing"
  tileExpandedLabel="Hide billing"
>
  <span slot="above">Team plan</span>
  <a slot="below" href="#billing">Billing history</a>
</ExpandableTile>
