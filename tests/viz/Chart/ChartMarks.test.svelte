<script lang="ts">
  import Chart from "carbon-components-svelte/viz/Chart/Chart.svelte";
  import ChartAnnotations from "carbon-components-svelte/viz/Chart/ChartAnnotations.svelte";
  import ChartBars from "carbon-components-svelte/viz/Chart/ChartBars.svelte";
  import ChartErrorBars from "carbon-components-svelte/viz/Chart/ChartErrorBars.svelte";
  import ChartLine from "carbon-components-svelte/viz/Chart/ChartLine.svelte";
  import ChartPoints from "carbon-components-svelte/viz/Chart/ChartPoints.svelte";

  export let mark: "bars" | "line" | "points" = "bars";
  export let mode: "grouped" | "stacked" = "grouped";
  export let labels: "none" | "auto" | "outside" | "inside" | "end" | "all" =
    "none";
  export let width = 640;

  const rows = [
    { day: "Mon", region: "a", value: 10, lo: 8, hi: 13, name: "Monday" },
    { day: "Tue", region: "a", value: 20, lo: 15, hi: 24, name: "Tuesday" },
    { day: "Mon", region: "b", value: 15, lo: 12, hi: 17, name: "Monday b" },
    { day: "Tue", region: "b", value: 5, lo: 3, hi: 8, name: "Tuesday b" },
  ];
</script>

<Chart
  data={rows}
  x="day"
  y="value"
  series="region"
  title="Marks"
  {width}
  height={300}
>
  {#if mark === "bars"}
    <ChartBars
      {mode}
      labels={labels === "end" || labels === "all" ? "none" : labels}
    />
    <ChartErrorBars lo="lo" hi="hi" bars={{ mode }} />
  {:else if mark === "line"}
    <ChartLine
      labels={labels === "end" || labels === "all" ? labels : "none"}
    />
  {:else}
    <ChartPoints
      labels={labels === "auto" || labels === "all" ? labels : "none"}
      label="name"
    />
  {/if}
  <ChartAnnotations
    items={[
      { x: "Tue", label: "Launch", kind: "info" },
      { x: "Mon", y: 15, label: "Peak", kind: "warning" },
    ]}
  />
</Chart>
