<script>
  import { NumberInput } from "carbon-components-svelte";

  let value = 10;
  let valueLocale = 1234.5;
  let valueNoWheel = 5;
</script>

<NumberInput
  data-testid="number-input-quantity"
  labelText="Quantity"
  bind:value
  min={0}
  max={100}
  step={1}
/>

<div data-testid="number-input-formatting">
  <NumberInput
    data-testid="number-input-locale"
    labelText="Amount (DE)"
    locale="de-DE"
    allowEmpty={true}
    bind:value={valueLocale}
    min={0}
    max={10000}
    step={0.1}
  />
  <span data-testid="number-input-locale-value" aria-live="polite">
    {valueLocale}
  </span>
</div>

<NumberInput
  data-testid="number-input-no-wheel"
  labelText="No wheel"
  bind:value={valueNoWheel}
  disableWheel={true}
  min={0}
  max={100}
/>
