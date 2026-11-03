<script>
  import { Button, DurationInput, Stack } from "carbon-components-svelte";

  let value = 5400000;
  let lastChange = "none yet";
</script>

<Stack gap={5}>
  <DurationInput
    labelText="Session timeout"
    bind:value
    on:change={(e) => (lastChange = String(e.detail.value))}
  />
  <p>value: {value ?? "null"} ms</p>
  <p>last change: {lastChange}</p>
  <Stack orientation="horizontal" gap={3}>
    <Button size="small" kind="tertiary" on:click={() => (value = 1800000)}>
      Set to 30 minutes
    </Button>
    <Button size="small" kind="ghost" on:click={() => (value = null)}>
      Clear
    </Button>
  </Stack>
</Stack>
