<script lang="ts">
  import BulletChart from "carbon-components-svelte/viz/BulletChart/BulletChart.svelte";
  import KpiCard from "carbon-components-svelte/viz/KpiCard/KpiCard.svelte";
  import Sparkline from "carbon-components-svelte/viz/Sparkline/Sparkline.svelte";

  export let loading = false;
  export let value: number | null = 1280000;
</script>

<KpiCard
  label="Monthly revenue"
  {value}
  format={{ style: "currency", currency: "USD", notation: "compact" }}
  delta={0.123}
  deltaLabel="vs last month"
  locale="en-US"
  {loading}
  data-testid="full"
>
  <Sparkline slot="chart" values={[3, 5, 4, 8, 9]} label="Trend" />
  <BulletChart
    slot="footer"
    value={1.28}
    target={1.5}
    max={2}
    label="Against target"
  />
</KpiCard>
<KpiCard
  label="Churn"
  value={0.021}
  format={{ style: "percent", maximumFractionDigits: 1 }}
  delta={-0.004}
  positive="down"
  href="/churn"
  data-testid="link"
/>
<KpiCard label="Signups" value={412} data-testid="bare" />
