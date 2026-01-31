<script>
  import { NumberInput, Stack } from "carbon-components-svelte";

  let value = null;
</script>

<Stack gap={4}>
  <NumberInput
    allowDecimal
    allowEmpty
    bind:value
    step={0.01}
    lang="de"
    labelText="Betrag (Amount)"
    helperText="Comma or period as decimal separator (e.g. 3,14 or 3.14)"
  />

  <div>
    <strong>Value:</strong>
    {value ?? "—"}
  </div>
</Stack>
