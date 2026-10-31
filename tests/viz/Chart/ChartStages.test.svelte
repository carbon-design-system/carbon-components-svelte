<script lang="ts">
  import BarChart from "carbon-components-svelte/viz/BarChart/BarChart.svelte";

  type Row = { quarter: string; region: string; revenue: number };

  export let data: ReadonlyArray<Row> = [];
  export let mode: "grouped" | "stacked" | "normalized" = "grouped";
  export let xTitle = "";
  export let yTitle = "";
  export let zoom: [number, number] | null = null;
  export let hidden: ReadonlyArray<string | number> = [];
  export let colors: Record<string, "purple"> = {};
</script>

<BarChart
  {data}
  x="quarter"
  y="revenue"
  series="region"
  {mode}
  {xTitle}
  {yTitle}
  {colors}
  bind:zoom
  bind:hidden
  width={640}
/>
