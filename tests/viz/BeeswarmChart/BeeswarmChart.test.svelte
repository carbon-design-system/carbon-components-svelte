<script lang="ts">
  import BeeswarmChart from "carbon-components-svelte/viz/BeeswarmChart/BeeswarmChart.svelte";

  type Row = { service: string; ms: number | null };

  export let data: ReadonlyArray<Row> = [
    ...[10, 20, 30, 40, 50, 60, 70, 80, 90, 300].map((ms) => ({
      service: "api",
      ms,
    })),
    ...[100, 100, 100, 100, 140].map((ms) => ({ service: "web", ms })),
    { service: "web", ms: null },
  ];
  export let radius = 3;
  export let view: "chart" | "table" = "chart";
</script>

<BeeswarmChart
  {data}
  x="service"
  y="ms"
  {radius}
  title="Latency by service"
  width={640}
  locale="en-US"
  bind:view
/>
