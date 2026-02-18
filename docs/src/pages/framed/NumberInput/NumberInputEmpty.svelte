<script>
  import { Button, NumberInput, Stack } from "carbon-components-svelte";

  let value = null;
</script>

<Stack gap={2}>
  <NumberInput allowEmpty bind:value />
  <div>
    <Button on:click={() => (value = null)}>Set to null</Button>
    <Button on:click={() => (value = 0)}>Set to 0</Button>
  </div>
  <div>
    <strong>Value:</strong>
    {value}
  </div>
</Stack>
