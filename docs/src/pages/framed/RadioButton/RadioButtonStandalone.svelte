<script>
  import { Button, RadioButton, Stack } from "carbon-components-svelte";

  let agreedToTerms = false;
</script>

<Stack gap={3}>
  <div style:display="flex">
    <RadioButton
      bind:checked={agreedToTerms}
      labelText="I agree to the terms and conditions"
      name="terms"
      value="agreed"
    />
  </div>
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
