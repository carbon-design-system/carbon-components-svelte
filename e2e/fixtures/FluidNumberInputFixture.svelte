<script>
  import { NumberInput } from "carbon-components-svelte";
</script>

<div data-testid="fluid-number-input-neutral">
  <NumberInput fluid labelText="Quantity" value={10} min={0} max={100} />
</div>

<div data-testid="fluid-number-input-invalid">
  <NumberInput
    fluid
    labelText="Quantity"
    value={10}
    min={0}
    max={100}
    invalid
    invalidText="Out of range"
  />
</div>

<div data-testid="fluid-number-input-warning">
  <NumberInput
    fluid
    labelText="Quantity"
    value={10}
    min={0}
    max={100}
    warn
    warnText="Close to the limit"
  />
</div>

<div data-testid="fluid-number-input-disabled">
  <NumberInput
    fluid
    labelText="Quantity"
    value={10}
    min={0}
    max={100}
    disabled
  />
</div>

<div data-testid="fluid-number-input-readonly">
  <NumberInput
    fluid
    labelText="Quantity"
    value={10}
    min={0}
    max={100}
    readonly
  />
</div>
