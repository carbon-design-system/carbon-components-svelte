<script lang="ts">
  import { StarRating } from "carbon-components-svelte";

  let value = 0;
</script>

<div data-testid="input">
  <StarRating bind:value legendText="Overall rating" />
</div>
<output data-testid="value">{value}</output>

<div data-testid="readonly">
  <StarRating readonly value={3.5} legendText="Average" />
</div>

<div data-testid="sm" style="display: inline-block">
  <StarRating size="sm" legendText="Small" hideLegend />
</div>
<div data-testid="lg" style="display: inline-block">
  <StarRating size="lg" legendText="Large" hideLegend />
</div>
