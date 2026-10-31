<script lang="ts">
  import ScatterChart from "carbon-components-svelte/viz/ScatterChart/ScatterChart.svelte";

  type Row = { x: number; y: number; tier: string };

  export let data: ReadonlyArray<Row> = [
    ...Array.from({ length: 40 }, (_, i) => ({
      x: 20 + (i % 5),
      y: 20 + Math.floor(i / 5),
      tier: "a",
    })),
    { x: 90, y: 90, tier: "b" },
    { x: 91, y: 89, tier: "b" },
  ];
  export let density: "none" | "hexbin" | "contour" = "hexbin";
  export let points: "behind" | "front" | "none" = "behind";
  export let hexSize = 12;
</script>

<ScatterChart
  {data}
  x="x"
  y="y"
  series="tier"
  {density}
  {points}
  {hexSize}
  contourLevels={4}
  title="Density"
  width={640}
  locale="en-US"
/>
