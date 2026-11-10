<script>
  import { Stack, TimeRangePicker } from "carbon-components-svelte";

  let value = {
    from: "2026-11-01T04:00:00.000Z",
    to: "2026-11-02T04:59:59.999Z",
  };
  let timeZone = "America/New_York";
</script>

<Stack gap={5}>
  <TimeRangePicker
    timeZones={["UTC", "America/New_York", "Europe/Berlin", "Asia/Kolkata"]}
    bind:value
    bind:timeZone
  />
  <p>time zone: <code>{timeZone}</code></p>
</Stack>
