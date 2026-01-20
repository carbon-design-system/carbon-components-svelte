<script>
  import {
    Button,
    ButtonSet,
    NumberInput,
    Stack,
  } from "carbon-components-svelte";

  let value = 1.5;
</script>

<Stack gap={4}>
  <NumberInput
    allowDecimal
    allowEmpty
    bind:value
    step={0.01}
    labelText="Amount"
  />

  <ButtonSet>
    <Button on:click={() => (value = null)}>Set to null</Button>
    <Button on:click={() => (value = 0)}>Set to 0</Button>
    <Button on:click={() => (value = 1.23)}>Set to 1.23</Button>
  </ButtonSet>

  <div>
    <strong>Value:</strong>
    {value}
  </div>
</Stack>
