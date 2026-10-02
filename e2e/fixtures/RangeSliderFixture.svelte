<script>
  import { RangeSlider } from "carbon-components-svelte";

  let value = 20;
  let valueUpper = 80;
  let changes = 0;
  let dragValue = 20;
  let dragValueUpper = 50;
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

<RangeSlider
  data-testid="range-slider-drag"
  bind:value={dragValue}
  bind:valueUpper={dragValueUpper}
  labelText="Draggable range"
  ariaLabelInput="Window start"
  ariaLabelInputUpper="Window end"
  trackDrag="brush"
/>
<div data-testid="drag-value-display">{dragValue}–{dragValueUpper}</div>
