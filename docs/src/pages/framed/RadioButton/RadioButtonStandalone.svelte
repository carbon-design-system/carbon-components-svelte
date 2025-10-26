<script>
  import { Button, RadioButton } from "carbon-components-svelte";

  let agreedToTerms = false;
</script>

<div style:display="flex">
  <RadioButton
    bind:checked={agreedToTerms}
    labelText="I agree to the terms and conditions"
    name="terms"
    value="agreed"
  />
</div>

<div style:margin="var(--cds-layout-02) 0">
  <Button
    size="small"
    kind="secondary"
    disabled={!agreedToTerms}
    on:click={() => (agreedToTerms = !agreedToTerms)}
  >
    Reset
  </Button>
</div>
