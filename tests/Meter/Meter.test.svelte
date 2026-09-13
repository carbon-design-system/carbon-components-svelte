<script>
  import Meter from "carbon-components-svelte/Meter/Meter.svelte";
</script>

<Meter labelText="Storage" value={812} max={1000} data-testid="basic" />

<Meter
  labelText="Storage"
  value={812}
  max={1000}
  valueText="812 GB of 1 TB"
  data-testid="value-text"
/>

<Meter
  labelText="Storage"
  value={812}
  max={1000}
  thresholds={{ warning: 800, error: 950 }}
  data-testid="warning"
/>

<Meter
  labelText="Storage"
  value={960}
  max={1000}
  thresholds={{ warning: 800, error: 950 }}
  data-testid="error"
/>

<Meter
  labelText="Storage"
  value={100}
  max={1000}
  thresholds={{ warning: 800, error: 950 }}
  data-testid="neither"
/>

<Meter
  labelText="Storage"
  value={960}
  max={1000}
  thresholds={{ warning: 800, error: 950 }}
  status="success"
  data-testid="explicit-success"
/>

<Meter
  labelText="Storage"
  value={1200}
  max={1000}
  data-testid="over-capacity"
/>

<Meter
  labelText="Storage"
  value={812}
  max={1000}
  hideLabel
  data-testid="hidden-label"
/>

<Meter
  labelText="Storage"
  value={812}
  max={1000}
  helperText="Approaching limit"
  data-testid="helper-text"
/>

<Meter
  labelText="Storage"
  value={812}
  max={1000}
  thresholds={{ warning: 800, error: 950 }}
  showThresholds
  data-testid="show-thresholds"
/>

<Meter labelText="Storage" value={0} max={0} data-testid="zero-max" />
