<script>
  import { FluidForm, NumberRangeInput, Stack } from "carbon-components-svelte";

  let price = [null, null];
  let priceValid = true;
  let filter = [10, 250];
  let ports = [8000, 8100];
  let memory = [1, 8];
  let german = [null, null];
  let fluid = [null, null];
</script>

<Stack gap={7}>
  <div data-testid="nri-default">
    <NumberRangeInput
      labelText="Price"
      min={0}
      max={1000}
      bind:value={price}
      bind:valid={priceValid}
    />
    <output data-testid="nri-default-value">{JSON.stringify(price)}</output>
    <output data-testid="nri-default-valid">{priceValid}</output>
  </div>

  <!-- A FilterPanel-style facet: the sidebar is 288px with 16px padding. -->
  <div data-testid="nri-sidebar" style="width: 288px; padding: 16px">
    <NumberRangeInput
      labelText="Price"
      slider
      min={0}
      max={1000}
      step={10}
      locale="en-US"
      formatOptions={{
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }}
      bind:value={filter}
    />
    <output data-testid="nri-sidebar-value">{JSON.stringify(filter)}</output>
  </div>

  <!-- A settings-style row: a port range with a helper and steppers. -->
  <div data-testid="nri-ports">
    <NumberRangeInput
      labelText="Port range"
      min={1}
      max={65535}
      separator="to"
      hideSteppers={false}
      allowOpen={false}
      helperText="Ports from 1 to 65535."
      bind:value={ports}
    />
    <output data-testid="nri-ports-value">{JSON.stringify(ports)}</output>
  </div>

  <div data-testid="nri-memory">
    <NumberRangeInput
      labelText="Memory"
      hideInputLabels
      slider
      min={1}
      max={16}
      locale="en-US"
      formatOptions={{ style: "unit", unit: "gigabyte" }}
      bind:value={memory}
    />
  </div>

  <div data-testid="nri-de">
    <NumberRangeInput
      labelText="Gewicht"
      locale="de-DE"
      minLabelText="Minimum"
      maxLabelText="Maximum"
      step={0.5}
      bind:value={german}
    />
    <output data-testid="nri-de-value">{JSON.stringify(german)}</output>
  </div>

  <!-- Too narrow for two fields side by side: they stack. -->
  <div data-testid="nri-narrow" style="width: 200px">
    <NumberRangeInput labelText="Price" min={0} max={1000} value={[10, 250]} />
  </div>

  <div data-testid="nri-invalid">
    <NumberRangeInput
      labelText="Price"
      value={[10, 250]}
      invalid
      invalidText="No listings in this price range."
    />
  </div>

  <div data-testid="nri-warn">
    <NumberRangeInput
      labelText="Price"
      value={[10, 250]}
      warn
      warnText="Few listings in this price range."
    />
  </div>

  <div data-testid="nri-crossed">
    <NumberRangeInput labelText="Price" value={[300, 250]} />
  </div>

  <div data-testid="nri-disabled">
    <NumberRangeInput labelText="Price" value={[10, 250]} disabled />
  </div>

  <div data-testid="nri-readonly">
    <NumberRangeInput labelText="Price" value={[10, 250]} readonly />
  </div>

  <div data-testid="nri-fluid">
    <FluidForm>
      <NumberRangeInput
        labelText="Price"
        min={0}
        max={1000}
        bind:value={fluid}
      />
    </FluidForm>
  </div>
</Stack>
