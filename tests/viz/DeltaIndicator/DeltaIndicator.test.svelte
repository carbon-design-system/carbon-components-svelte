<script lang="ts">
  import DeltaIndicator from "carbon-components-svelte/viz/DeltaIndicator/DeltaIndicator.svelte";

  export let value: number | null | undefined = 0.123;
  export let positive: "up" | "down" = "up";
</script>

<DeltaIndicator data-testid="up" value={128} />
<DeltaIndicator data-testid="down" value={-64} />
<DeltaIndicator data-testid="zero" value={0} />
<DeltaIndicator data-testid="missing" value={undefined} />
<DeltaIndicator data-testid="nan" value={Number.NaN} />

<DeltaIndicator data-testid="lower-better-down" value={-320} positive="down" />
<DeltaIndicator data-testid="lower-better-up" value={45} positive="down" />

<DeltaIndicator
  data-testid="within"
  value={0.004}
  format="percent"
  threshold={0.005}
/>
<DeltaIndicator
  data-testid="at"
  value={0.005}
  format="percent"
  threshold={0.005}
/>
<DeltaIndicator
  data-testid="beyond"
  value={0.04}
  format="percent"
  threshold={0.005}
/>

<DeltaIndicator data-testid="percent" value={0.123} format="percent" />
<DeltaIndicator data-testid="full" value={12840} compact={false} />
<DeltaIndicator data-testid="compact" value={12840} />
<DeltaIndicator
  data-testid="currency"
  value={1250}
  compact={false}
  format={{ style: "currency", currency: "USD" }}
/>
<DeltaIndicator data-testid="fn" value={3} format={(n) => `${n} seats`} />
<DeltaIndicator
  data-testid="locale"
  value={0.1234}
  format="percent"
  fractionDigits={2}
  locale="de-DE"
/>

<DeltaIndicator
  data-testid="label"
  value={0.082}
  format="percent"
  label="vs last week"
/>
<DeltaIndicator
  data-testid="no-icon"
  value={-0.041}
  format="percent"
  hideIcon
/>
<DeltaIndicator data-testid="sm" value={1} size="sm" />
<DeltaIndicator data-testid="lg" value={1} size="lg" />
<DeltaIndicator
  data-testid="described"
  value={0.123}
  format="percent"
  description="Hausse de 12,3 %"
/>

<DeltaIndicator data-testid="reactive" {value} {positive} format="percent" />
