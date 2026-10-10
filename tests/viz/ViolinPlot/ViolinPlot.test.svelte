<script lang="ts">
  import ViolinPlot from "carbon-components-svelte/viz/ViolinPlot/ViolinPlot.svelte";

  type Row = { service: string; ms: number | null };

  export let data: ReadonlyArray<Row> = [
    ...[10, 20, 30, 40, 50, 60, 70, 80, 90, 300].map((ms) => ({
      service: "api",
      ms,
    })),
    ...[100, 110, 120, 130, 140].map((ms) => ({ service: "web", ms })),
    { service: "web", ms: null },
  ];
  export let inner = true;
  export let view: "chart" | "table" = "chart";
</script>

<ViolinPlot
  {data}
  x="service"
  y="ms"
  {inner}
  title="Latency by service"
  width={640}
  locale="en-US"
  bind:view
/>
