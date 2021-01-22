<script lang="ts">
  import { ExpandableTile } from "../types";
</script>

<ExpandableTile>
  <div slot="above" style="height: 10rem">Above the fold content here</div>
  <div slot="below" style="height: 10rem">Below the fold content here</div>
</ExpandableTile>

<ExpandableTile expanded>
  <div slot="above" style="height: 10rem">Above the fold content here</div>
  <div slot="below" style="height: 10rem">Below the fold content here</div>
</ExpandableTile>

<ExpandableTile
  light
  tileExpandedLabel="View less"
  tileCollapsedLabel="View more"
>
  <div slot="above" style="height: 10rem">Above the fold content here</div>
  <div slot="below" style="height: 10rem">Below the fold content here</div>
</ExpandableTile>
