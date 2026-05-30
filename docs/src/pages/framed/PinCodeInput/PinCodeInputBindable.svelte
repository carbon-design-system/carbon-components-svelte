<script>
  import { PinCodeInput, Stack } from "carbon-components-svelte";

  let value = "";
  let complete = false;
</script>

<Stack gap={4}>
  <PinCodeInput
    count={4}
    bind:value
    bind:complete
    labelText="Verification code"
  />
  <div>value: {JSON.stringify(value)}</div>
  <div>complete: {complete}</div>
</Stack>
