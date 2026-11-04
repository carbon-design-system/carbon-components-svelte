<script>
  import { CurrencyInput } from "carbon-components-svelte";

  let value = "1250.00";
</script>

<CurrencyInput
  bind:value
  currency="USD"
  labelText="Transfer"
  helperText="From 10 to 5,000, in steps of 0.05"
  invalidText="Enter an amount from 10 to 5,000 in steps of 0.05."
  min="10"
  max="5000"
  step="0.05"
/>
