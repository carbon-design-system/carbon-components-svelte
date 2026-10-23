<script lang="ts">
  import ComboChart from "carbon-components-svelte/viz/ComboChart/ComboChart.svelte";

  type Row = { quarter: string; metric: string; value: number };

  export let data: ReadonlyArray<Row> = [
    { quarter: "Q1", metric: "Revenue", value: 1200 },
    { quarter: "Q2", metric: "Revenue", value: 1800 },
    { quarter: "Q1", metric: "Cost", value: 900 },
    { quarter: "Q2", metric: "Cost", value: 1100 },
    { quarter: "Q1", metric: "Margin", value: 0.25 },
    { quarter: "Q2", metric: "Margin", value: 0.4 },
  ];
  export let secondary: ReadonlyArray<string> = ["Margin"];
  export let view: "chart" | "table" = "chart";
</script>

<ComboChart
  {data}
  x="quarter"
  y="value"
  series="metric"
  bars={["Revenue", "Cost"]}
  lines={["Margin"]}
  {secondary}
  y2Format={{ style: "percent" }}
  y2Title="Margin"
  title="Revenue, cost, and margin"
  width={640}
  locale="en-US"
  bind:view
/>
