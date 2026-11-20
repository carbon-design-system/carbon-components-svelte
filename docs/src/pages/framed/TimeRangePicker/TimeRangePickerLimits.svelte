<script>
  import { TimeRangePicker } from "carbon-components-svelte";

  let value = { from: "now-24h", to: "now" };
</script>

<TimeRangePicker stepping min="now-30d" max="now" maxRange="7d" bind:value />
