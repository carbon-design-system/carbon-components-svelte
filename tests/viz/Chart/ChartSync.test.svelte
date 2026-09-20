<script lang="ts">
  import Chart from "carbon-components-svelte/viz/Chart/Chart.svelte";
  import ChartRuler from "carbon-components-svelte/viz/Chart/ChartRuler.svelte";

  export let syncB: string | undefined = "ops";
  export let onhoverB: (detail: unknown) => void = () => {};

  const rows = (scale: number) =>
    [0, 1, 2, 3].map((day) => ({ day, value: (day + 1) * scale }));
</script>

<Chart
  data={rows(10)}
  x="day"
  y="value"
  title="Traffic"
  width={400}
  syncId="ops"
>
  <ChartRuler data-testid="ruler-a" />
</Chart>

<Chart
  data={rows(3)}
  x="day"
  y="value"
  title="Errors"
  width={400}
  syncId={syncB}
  on:hover={(e) => onhoverB(e.detail)}
>
  <ChartRuler data-testid="ruler-b" />
</Chart>

<Chart data={rows(1)} x="day" y="value" title="Unrelated" width={400}>
  <ChartRuler data-testid="ruler-c" />
</Chart>
