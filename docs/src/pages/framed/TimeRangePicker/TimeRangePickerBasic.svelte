<script>
  import { Stack, TimeRangePicker } from "carbon-components-svelte";

  let value = { from: "now-15m", to: "now" };
</script>

<Stack gap={5}>
  <TimeRangePicker bind:value />
  <p>from: <code>{value.from}</code>, to: <code>{value.to}</code></p>
</Stack>
