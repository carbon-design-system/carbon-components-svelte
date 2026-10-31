<script lang="ts">
  import ScatterChart from "carbon-components-svelte/viz/ScatterChart/ScatterChart.svelte";

  type Row = { x: number; y: number; tier: string };

  export let count = 12;
  export let renderer: "auto" | "svg" | "canvas" = "canvas";
  export let canvasThreshold = 5000;
  export let onhover: (detail: unknown) => void = () => {};

  $: data = Array.from({ length: count }, (_, i) => ({
    x: (i * 37) % 100,
    y: (i * 53) % 100,
    tier: i % 2 ? "a" : "b",
  })) as Row[];
</script>

<ScatterChart
  {data}
  x="x"
  y="y"
  series="tier"
  {renderer}
  {canvasThreshold}
  title="Painted"
  width={640}
  locale="en-US"
  on:hover={(e) => onhover(e.detail)}
/>
