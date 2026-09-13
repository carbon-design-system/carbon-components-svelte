<script>
  import { Button, RadioButton, Stack } from "carbon-components-svelte";

  let acknowledged = false;
</script>

<Stack gap={6}>
  <Stack align="start">
    <RadioButton
      bind:checked={acknowledged}
      labelText="I acknowledge this will restart the production service"
      name="maintenance-ack"
      value="acknowledged"
    />
  </Stack>
  <div>
    <Button
      size="small"
      kind="secondary"
      disabled={!acknowledged}
      on:click={() => (acknowledged = !acknowledged)}
    >
      Reset
    </Button>
  </div>
</Stack>
