<script>
  import { AddressForm, Stack } from "carbon-components-svelte";

  let value = { country: "US" };
</script>

<Stack gap={6}>
  <AddressForm bind:value legendText="Billing address" />
  <pre>{JSON.stringify(value, null, 2)}</pre>
</Stack>
