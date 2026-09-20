<script lang="ts">
  import ChartThreshold from "carbon-components-svelte/viz/Chart/ChartThreshold.svelte";
  import LineChart from "carbon-components-svelte/viz/LineChart/LineChart.svelte";

  export let data = [
    { day: 0, region: "a", revenue: 40 },
    { day: 1, region: "a", revenue: 50 },
    { day: 2, region: "a", revenue: 60 },
    { day: 0, region: "b", revenue: 80 },
    { day: 1, region: "b", revenue: 70 },
    { day: 2, region: "b", revenue: 65 },
  ];
  export let zero = false;
  export let grid = true;
  export let legend = true;
  export let tooltip = true;
  export let curve: "linear" | "monotone" = "linear";
  export let yTitle = "";
  export let hidden: ReadonlyArray<string | number> = [];
  export let withThreshold = false;
  export let onselect: (detail: unknown) => void = () => {};
  export let ontoggle: (detail: unknown) => void = () => {};
</script>

<LineChart
  {data}
  x="day"
  y="revenue"
  series="region"
  title="Revenue"
  width={640}
  height={240}
  {zero}
  {grid}
  {legend}
  {tooltip}
  {curve}
  {yTitle}
  bind:hidden
  data-testid="chart"
  on:select={(e) => onselect(e.detail)}
  on:legend:toggle={(e) => ontoggle(e.detail)}
>
  {#if withThreshold}
    <ChartThreshold y={200} label="Target" />
  {/if}
</LineChart>

<output data-testid="hidden">{hidden.join(",")}</output>
