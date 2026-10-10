<script lang="ts">
  import ComparisonBar from "carbon-components-svelte/viz/ComparisonBar/ComparisonBar.svelte";

  export let value = 1284;
  export let previous: number | null = 912;
</script>

<ComparisonBar
  {value}
  {previous}
  valueLabel="This period"
  previousLabel="Last period"
  label="Orders"
  showDelta
  data-testid="basic"
/>
<ComparisonBar {value} {previous} data-testid="decorative" />
<ComparisonBar
  value={40}
  previous={80}
  positive="down"
  color="success"
  size="sm"
  showDelta
  format={(v) => `${v} ms`}
  label="Latency"
  data-testid="down"
/>
<ComparisonBar
  {value}
  previous={null}
  showDelta
  label="No baseline"
  data-testid="missing"
/>
