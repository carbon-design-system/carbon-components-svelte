<script>
  import { RecurrencePicker, Stack } from "carbon-components-svelte";

  let value = "FREQ=WEEKLY;INTERVAL=2;BYDAY=TU,TH";
  let rule = null;
</script>

<Stack gap={5}>
  <RecurrencePicker
    startDate={new Date(2026, 10, 3)}
    previewCount={3}
    bind:value
    bind:rule
  />
  <p>value: {value || "(empty)"}</p>
  <p>rule: {JSON.stringify(rule)}</p>
</Stack>
