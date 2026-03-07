<script>
  import { NumberInput } from "carbon-components-svelte";

  let value = 10;
</script>

<div class="fixture-container">
  <NumberInput
    data-testid="number-input-quantity"
    labelText="Quantity"
    bind:value
    min={0}
    max={100}
    step={1}
  />
</div>

<style>
  .fixture-container {
    padding: 2rem;
  }
</style>
