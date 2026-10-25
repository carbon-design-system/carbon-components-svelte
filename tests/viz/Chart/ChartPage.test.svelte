<script lang="ts">
  import Chart from "carbon-components-svelte/viz/Chart/Chart.svelte";
  import ChartColors from "carbon-components-svelte/viz/Chart/ChartColors.svelte";
  import ChartLegend from "carbon-components-svelte/viz/Chart/ChartLegend.svelte";
  import ChartLine from "carbon-components-svelte/viz/Chart/ChartLine.svelte";

  export let hiddenB: ReadonlyArray<string | number> = [];
  const rows = [0, 1, 2].flatMap((day) => [
    { day, region: "a", value: day + 1 },
    { day, region: "b", value: 10 - day },
  ]);
</script>

<ChartColors colors={{ b: "cat-05" }}>
  <Chart
    data={rows}
    x="day"
    y="value"
    series="region"
    title="A"
    width={400}
    syncId="page"
    sync={["hover", "hidden"]}
  >
    <ChartLine />
    <ChartLegend slot="legend" data-testid="legend-a" />
  </Chart>
  <Chart
    data={rows}
    x="day"
    y="value"
    series="region"
    title="B"
    width={400}
    syncId="page"
    sync={["hover", "hidden"]}
    colors={{ a: "cat-09" }}
    bind:hidden={hiddenB}
  >
    <ChartLine />
    <ChartLegend slot="legend" data-testid="legend-b" />
  </Chart>
</ChartColors>
<output data-testid="hidden-b">{hiddenB.join(",")}</output>
