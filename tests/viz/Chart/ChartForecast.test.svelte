<script lang="ts">
  import Chart from "carbon-components-svelte/viz/Chart/Chart.svelte";
  import ChartAnomalies from "carbon-components-svelte/viz/Chart/ChartAnomalies.svelte";
  import ChartAxis from "carbon-components-svelte/viz/Chart/ChartAxis.svelte";
  import ChartBand from "carbon-components-svelte/viz/Chart/ChartBand.svelte";
  import ChartLine from "carbon-components-svelte/viz/Chart/ChartLine.svelte";

  type Row = {
    day: number;
    value: number;
    lo: number | null;
    hi: number | null;
    odd?: boolean;
  };

  export let data: ReadonlyArray<Row> = [
    { day: 0, value: 10, lo: null, hi: null },
    { day: 1, value: 20, lo: null, hi: null },
    { day: 2, value: 30, lo: null, hi: null, odd: true },
    { day: 3, value: 40, lo: 30, hi: 55 },
    { day: 4, value: 50, lo: 35, hi: 90 },
  ];
  export let forecastFrom: number | undefined = undefined;
  export let band = false;
  export let anomalies = false;
  export let hidden: ReadonlyArray<string | number> = [];
</script>

<Chart
  {data}
  x="day"
  y="value"
  series={() => "s"}
  title="Demand"
  width={640}
  bind:hidden
>
  <ChartAxis position="left" data-testid="axis-y" />
  {#if band}
    <ChartBand lower="lo" upper="hi" data-testid="band" />
  {/if}
  <ChartLine {forecastFrom} data-testid="line" />
  {#if anomalies}
    <ChartAnomalies when="odd" data-testid="anomalies" />
  {/if}
</Chart>
