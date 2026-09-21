<script lang="ts">
  import LineChart from "carbon-components-svelte/viz/LineChart/LineChart.svelte";

  type Row = { day: number | string; revenue: number };

  export let data: ReadonlyArray<Row> = Array.from(
    { length: 101 },
    (_, day) => ({
      day,
      revenue: 100 + day,
    }),
  );
  export let zoom: [number, number] | null = null;
</script>

<LineChart
  {data}
  x="day"
  y="revenue"
  title="Revenue"
  width={640}
  locale="en-US"
  zoomBar
  bind:zoom
/>
<output data-testid="zoom">{zoom ? zoom.join("–") : "all"}</output>
