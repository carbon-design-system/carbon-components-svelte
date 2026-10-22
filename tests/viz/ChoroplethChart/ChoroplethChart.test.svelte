<script lang="ts">
  import ChoroplethChart from "carbon-components-svelte/viz/ChoroplethChart/ChoroplethChart.svelte";

  const square = (x: number, y: number) => [
    [
      [x, y],
      [x + 10, y],
      [x + 10, y + 10],
      [x, y + 10],
      [x, y],
    ],
  ];
  const features = ["West", "Central", "East"].map((name, i) => ({
    id: name.toLowerCase(),
    properties: { name },
    geometry: { type: "Polygon" as const, coordinates: square(i * 10, 0) },
  }));

  type Row = { area: string; sales: number | null };

  export let data: ReadonlyArray<Row> = [
    { area: "west", sales: 10 },
    { area: "west", sales: 30 },
    { area: "east", sales: 100 },
    { area: "central", sales: null },
  ];
  export let onhover: (detail: unknown) => void = () => {};
  export let onselect: (detail: unknown) => void = () => {};
</script>

<ChoroplethChart
  {features}
  {data}
  region="area"
  value="sales"
  title="Sales by region"
  projection="equirectangular"
  locale="en-US"
  on:hover={(e) => onhover(e.detail)}
  on:select={(e) => onselect(e.detail)}
/>
