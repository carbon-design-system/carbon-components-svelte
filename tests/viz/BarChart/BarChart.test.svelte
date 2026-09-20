<script lang="ts">
  import BarChart from "carbon-components-svelte/viz/BarChart/BarChart.svelte";

  type Row = { quarter: string | Date; product: string; revenue: number };

  export let data: ReadonlyArray<Row> = [
    { quarter: "Q1", product: "a", revenue: 10 },
    { quarter: "Q2", product: "a", revenue: 20 },
    { quarter: "Q3", product: "a", revenue: 30 },
    { quarter: "Q1", product: "b", revenue: 30 },
    { quarter: "Q2", product: "b", revenue: 40 },
    { quarter: "Q3", product: "b", revenue: 50 },
  ];
  export let mode: "grouped" | "stacked" | "normalized" = "grouped";
  export let hidden: ReadonlyArray<string | number> = [];
  export let onselect: (detail: unknown) => void = () => {};
</script>

<BarChart
  {data}
  x="quarter"
  y="revenue"
  series="product"
  title="Revenue by quarter"
  width={640}
  locale="en-US"
  {mode}
  bind:hidden
  on:select={(e) => onselect(e.detail)}
/>
