<script>
  import Meter from "carbon-components-svelte/Meter/Meter.svelte";

  function shortRangeText(value, max) {
    return `${value}/${max}`;
  }
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
  value={1200}
  max={1000}
  valueText="812 GB of 1 TB"
  data-testid="over-capacity-value-text"
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

<Meter labelText="Storage" value={-5} max={100} data-testid="negative-value" />

<Meter
  labelText="Storage"
  value={Number.NaN}
  max={100}
  data-testid="nan-value"
/>

<Meter
  labelText="Storage"
  value={812}
  max={1000}
  thresholds={{ warning: 700, error: 900 }}
  showThresholds
  data-testid="thresholds-both"
/>

<Meter
  labelText="Storage"
  value={960}
  max={1000}
  thresholds={{ warning: 800, error: 950 }}
  errorText="Critical"
  data-testid="custom-error-text"
/>

<Meter
  labelText="Storage"
  value={812}
  max={1000}
  thresholds={{ warning: 700 }}
  showThresholds
  data-testid="thresholds-warning-only"
/>

<Meter labelText="Storage" value={812} max={1000} data-testid="no-thresholds" />

<Meter
  labelText="Storage"
  value={812}
  max={1000}
  helperText="Approaching limit"
  thresholds={{ warning: 700, error: 900 }}
  showThresholds
  data-testid="helper-and-thresholds"
/>

<Meter
  labelText="Storage"
  value={812}
  max={1000}
  thresholds={{ warning: 700, error: 900 }}
  data-testid="thresholds-no-show"
/>

<Meter
  labelText="Storage"
  value={812}
  max={1000}
  thresholds={{ warning: 700, error: 900 }}
  showThresholds
  thresholdsText={({ warning, error }) => `Custom: ${warning}/${error}`}
  data-testid="custom-thresholds-text"
/>

<Meter
  labelText="Storage"
  value={812}
  max={1000}
  thresholds={{ warning: 700, error: 900 }}
  showThresholds
  thresholdsText={() => ""}
  data-testid="empty-thresholds-text"
/>

<Meter
  labelText="Storage"
  value={1200}
  max={1000}
  valueRangeText={shortRangeText}
  data-testid="custom-value-range-text"
/>
