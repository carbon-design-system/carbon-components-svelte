<script lang="ts">
  import Chart from "carbon-components-svelte/viz/Chart/Chart.svelte";
  import ChartAxis from "carbon-components-svelte/viz/Chart/ChartAxis.svelte";
  import ChartGrid from "carbon-components-svelte/viz/Chart/ChartGrid.svelte";
  import ChartLine from "carbon-components-svelte/viz/Chart/ChartLine.svelte";

  type Row = { day: number; region: string; revenue: number | null };

  export let data: ReadonlyArray<Row> = [
    { day: 0, region: "a", revenue: 10 },
    { day: 1, region: "a", revenue: 20 },
    { day: 2, region: "a", revenue: 30 },
    { day: 0, region: "b", revenue: 80 },
    { day: 1, region: "b", revenue: 60 },
    { day: 2, region: "b", revenue: 40 },
  ];
  export let width = 640;
  export let hidden: ReadonlyArray<string | number> = [];
  export let curve: "linear" | "monotone" | "step" = "linear";
  export let points: "none" | "hover" | "all" = "hover";
  export let dashed: boolean | ReadonlyArray<string> = false;
  export let downsample = true;
  export let gridX = false;
  export let axisFormat: ((value: number) => string) | undefined = undefined;
  export let axisTitle = "";
</script>

<Chart
  {data}
  x="day"
  y="revenue"
  series="region"
  title="Revenue"
  {width}
  {hidden}
>
  <ChartGrid x={gridX} />
  <ChartAxis
    position="bottom"
    format={axisFormat}
    title={axisTitle}
    data-testid="axis-x"
  />
  <ChartAxis position="left" data-testid="axis-y" />
  <ChartLine {curve} {points} {dashed} {downsample} data-testid="line" />
</Chart>
