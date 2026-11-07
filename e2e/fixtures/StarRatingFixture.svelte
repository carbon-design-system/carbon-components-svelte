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

<div data-testid="readonly-rtl" dir="rtl">
  <StarRating readonly value={3.5} legendText="Average" />
</div>

<div data-testid="sm" style="display: inline-block">
  <StarRating size="sm" legendText="Small" hideLegend />
</div>
<div data-testid="lg" style="display: inline-block">
  <StarRating size="lg" legendText="Large" hideLegend />
</div>

<div data-testid="invalid">
  <StarRating legendText="Quality" invalid invalidText="Choose a rating" />
</div>
<div data-testid="warn">
  <StarRating
    legendText="Value"
    value={1}
    warn
    warnText="A one-star review asks for a comment"
  />
</div>
<div data-testid="disabled">
  <StarRating legendText="Delivery" value={3} disabled />
</div>
