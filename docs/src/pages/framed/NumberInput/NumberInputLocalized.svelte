<script>
  import { NumberInput } from "carbon-components-svelte";

  let value = 1.5;
</script>

<NumberInput
  allowDecimal
  lang="de"
  bind:value
  labelText="Betrag"
  helperText="German locale: use comma (,) as decimal separator"
  step={0.1}
/>

<strong>Value:</strong>
{value}
