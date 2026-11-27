<script>
  import {
    formatAbsoluteRange,
    resolveRange,
    Stack,
    Tag,
    TimeRangePicker,
  } from "carbon-components-svelte";
  import { onMount } from "svelte";

  let value = { from: "now-1h", to: "now" };
  let timeZone = "America/New_York";
  let refreshInterval = 30;
  let refreshes = 0;
  let shown = "";

  // For demo purposes only: a real dashboard queries its API for the range.
  function load() {
    const { start, end } = resolveRange(value, { timeZone });
    shown = formatAbsoluteRange(start, end, { timeZone, seconds: true });
  }

  onMount(load);
</script>

<Stack gap={5}>
  <TimeRangePicker
    stepping
    refresh="auto"
    max="now"
    bind:value
    bind:timeZone
    bind:refreshInterval
    on:change={load}
    on:refresh={() => {
      refreshes += 1;
      load();
    }}
  />
  <Stack orientation="horizontal" gap={3}>
    <Tag type="gray">Checkout API, p95</Tag>
    <Tag type="blue">{refreshes} refreshes</Tag>
  </Stack>
  <p>Showing {shown}</p>
</Stack>
