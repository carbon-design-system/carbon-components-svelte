<script lang="ts">
  import Chart from "carbon-components-svelte/viz/Chart/Chart.svelte";
  import ChartLine from "carbon-components-svelte/viz/Chart/ChartLine.svelte";
  import ChartToolbar from "carbon-components-svelte/viz/Chart/ChartToolbar.svelte";

  export let view: "chart" | "table" = "chart";
  export let hidden: ReadonlyArray<string | number> = [];
  export let csv = true;
  export let image: "png" | "svg" | false = "svg";

  const data = [
    { quarter: "Q1", region: "a", revenue: 1200 },
    { quarter: "Q2", region: "a", revenue: 1500 },
    { quarter: "Q1", region: "b", revenue: 800 },
    { quarter: "Q3", region: "b", revenue: null },
  ];
</script>

<Chart
  {data}
  x="quarter"
  y="revenue"
  series="region"
  title="Revenue"
  width={640}
  {hidden}
  bind:view
>
  <ChartLine />
  <ChartToolbar slot="toolbar" {csv} {image} filename="revenue" />
</Chart>

<output data-testid="view">{view}</output>
