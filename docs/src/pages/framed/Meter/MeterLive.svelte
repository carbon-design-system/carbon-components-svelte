<script>
  import { Meter, Slider, Stack } from "carbon-components-svelte";

  let value = 420;
  const max = 1000;
  const thresholds = { warning: 800, error: 950 };

  $: helperText = `${value} GB used of ${max} GB`;
</script>

<Stack gap={6}>
  <Meter labelText="Storage" {value} {max} {thresholds} {helperText} />
  <Slider labelText="Usage (GB)" bind:value min={0} max={1200} step={10} />
</Stack>
