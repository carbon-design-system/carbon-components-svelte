<script>
  import { NumberInput } from "carbon-components-svelte";

  let value = 10;
</script>

<NumberInput
  data-testid="number-input-quantity"
  labelText="Quantity"
  bind:value
  min={0}
  max={100}
  step={1}
/>
