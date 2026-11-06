<script>
  import { NumberRangeInput, Stack } from "carbon-components-svelte";

  let ports = [8000, 8100];
  let memory = [2, 8];
</script>

<Stack gap={7}>
  <NumberRangeInput
    labelText="Port range"
    helperText="Ports from 1 to 65535. Both ends are required."
    min={1}
    max={65535}
    allowOpen={false}
    separator="to"
    hideSteppers={false}
    bind:value={ports}
  />

  <NumberRangeInput
    labelText="Memory"
    helperText="Leave an end empty for no limit."
    min={1}
    max={64}
    locale="en-US"
    formatOptions={{ style: "unit", unit: "gigabyte" }}
    hideInputLabels
    separator="to"
    bind:value={memory}
  />
</Stack>
