<script lang="ts">
  import RangeIndicator from "carbon-components-svelte/viz/RangeIndicator/RangeIndicator.svelte";

  export let value = 92;
</script>

<RangeIndicator
  min={12}
  max={480}
  {value}
  quartiles={[40, 88, 140]}
  label="Latency"
  data-testid="basic"
/>
<RangeIndicator min={0} max={100} {value} data-testid="decorative" />
<RangeIndicator
  min={0}
  max={50}
  {value}
  showRange
  color="error"
  size="sm"
  format={(v) => `${v} ms`}
  translations={{ range: "Bereich" }}
  label="Latenz"
  data-testid="outside"
/>
<RangeIndicator
  min={0}
  max={100}
  quartiles={[20, 50, 70]}
  label="Spread"
  data-testid="no-value"
/>
