<script>
  import { RangeSlider } from "carbon-components-svelte";

  let value = 20;
  let valueUpper = 80;
  let changes = 0;
</script>

<RangeSlider
  data-testid="range-slider"
  bind:value
  bind:valueUpper
  labelText="Range"
  min={0}
  max={100}
  step={1}
  on:change={() => changes++}
/>
<div data-testid="value-display">{value}</div>
<div data-testid="value-upper-display">{valueUpper}</div>
<div data-testid="change-count">{changes}</div>
