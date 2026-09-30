<script>
  import { Slider } from "carbon-components-svelte";

  let value = 50;
  let changes = 0;
</script>

<Slider
  data-testid="slider"
  bind:value
  labelText="Slider"
  min={0}
  max={100}
  step={1}
  on:change={() => changes++}
/>
<div data-testid="value-display">{value}</div>
<div data-testid="change-count">{changes}</div>
