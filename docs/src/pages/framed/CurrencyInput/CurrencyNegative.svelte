<script>
  import { CurrencyInput, Stack } from "carbon-components-svelte";

  let adjustment = "-250.00";
  let balance = "-1250.5";
</script>

<Stack gap={4}>
  <CurrencyInput
    allowNegative
    bind:value={adjustment}
    currency="USD"
    labelText="Adjustment"
    helperText="Type a minus sign for a credit"
  />

  <CurrencyInput
    allowNegative
    bind:value={balance}
    currency="USD"
    currencySign="accounting"
    labelText="Balance"
    helperText="Accounting style"
  />
</Stack>
