<script>
  import { RangeSlider } from "carbon-components-svelte";

  let value = 20;
  let valueUpper = 80;
</script>

<RangeSlider
  data-testid="range-slider"
  bind:value
  bind:valueUpper
  labelText="Range"
  min={0}
  max={100}
  step={1}
/>
<div data-testid="value-display">{value}</div>
<div data-testid="value-upper-display">{valueUpper}</div>

<div data-testid="range-slider-narrow" style:width="320px">
  <RangeSlider
    fullWidth
    labelText="Departure window"
    ariaLabelInput="Earliest departure"
    ariaLabelInputUpper="Latest departure"
    value={6}
    valueUpper={18}
    min={0}
    max={23}
  />
</div>
