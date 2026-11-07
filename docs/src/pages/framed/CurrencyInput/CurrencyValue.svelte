<script>
  import {
    Button,
    ButtonSet,
    compareDecimal,
    currencyFractionDigits,
    CurrencyInput,
    Stack,
    toMinorUnits,
  } from "carbon-components-svelte";

  let value = "19.99";

  $: minor =
    value === "" ? null : toMinorUnits(value, currencyFractionDigits("USD"));
  $: expensive = value !== "" && compareDecimal(value, "100") > 0;
</script>

<Stack gap={4}>
  <CurrencyInput bind:value currency="USD" labelText="Unit price" />

  <ButtonSet>
    <Button on:click={() => (value = "")}>Clear</Button>
    <Button on:click={() => (value = "0.30")}>Set to 0.30</Button>
    <Button on:click={() => (value = "1234567.89")}>Set to 1234567.89</Button>
  </ButtonSet>

  <div>
    <strong>Value:</strong>
    {JSON.stringify(value)}
  </div>
  <div>
    <strong>Cents:</strong>
    {minor}
  </div>
  <div>
    <strong>Over 100:</strong>
    {expensive}
  </div>
</Stack>
