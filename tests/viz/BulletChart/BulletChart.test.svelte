<script lang="ts">
  import BulletChart from "carbon-components-svelte/viz/BulletChart/BulletChart.svelte";

  export let value = 270;
  export let onthreshold: (detail: unknown) => void = () => {};
</script>

<BulletChart
  {value}
  target={300}
  max={400}
  bands={[150, 250]}
  label="Revenue"
  data-testid="basic"
  on:threshold={(e) => onthreshold(e.detail)}
/>
<BulletChart {value} max={400} data-testid="decorative" />
<BulletChart
  {value}
  target={300}
  max={400}
  label="Umsatz"
  targetLabel="Ziel"
  showValue
  size="sm"
  color="success"
  format={{ style: "currency", currency: "EUR", maximumFractionDigits: 0 }}
  locale="de-DE"
  data-testid="formatted"
/>
<BulletChart {value} max={400} color={3} size="lg" data-testid="categorical" />
