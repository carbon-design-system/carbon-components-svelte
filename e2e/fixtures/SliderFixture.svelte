<script>
  import { Slider } from "carbon-components-svelte";

  let value = 50;
</script>

<Slider
  data-testid="slider"
  bind:value
  labelText="Slider"
  min={0}
  max={100}
  step={1}
/>
<div data-testid="value-display">{value}</div>
