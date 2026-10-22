<script lang="ts">
  import BoxplotChart from "carbon-components-svelte/viz/BoxplotChart/BoxplotChart.svelte";

  type Row = { service: string; ms: number | null };

  export let data: ReadonlyArray<Row> = [
    ...[10, 20, 30, 40, 50, 60, 70, 80, 90, 300].map((ms) => ({
      service: "api",
      ms,
    })),
    ...[100, 110, 120, 130, 140].map((ms) => ({ service: "web", ms })),
    { service: "web", ms: null },
  ];
  export let orientation: "vertical" | "horizontal" = "vertical";
  export let view: "chart" | "table" = "chart";
</script>

<BoxplotChart
  {data}
  x="service"
  y="ms"
  title="Latency by service"
  width={640}
  locale="en-US"
  {orientation}
  bind:view
/>
