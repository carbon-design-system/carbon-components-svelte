<script>
  import { Button, RadioButton, Stack } from "carbon-components-svelte";

  let agreedToTerms = false;
</script>

<Stack gap={6}>
  <Stack align="start">
    <RadioButton
      bind:checked={agreedToTerms}
      labelText="I agree to the terms and conditions"
      name="terms"
      value="agreed"
    />
  </Stack>
  <div>
    <Button
      size="small"
      kind="secondary"
      disabled={!agreedToTerms}
      on:click={() => (agreedToTerms = !agreedToTerms)}
    >
      Reset
    </Button>
  </div>
</Stack>
