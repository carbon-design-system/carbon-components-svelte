<script lang="ts">
  import RidgelineChart from "carbon-components-svelte/viz/RidgelineChart/RidgelineChart.svelte";

  type Row = { month: string; temp: number | null };

  export let data: ReadonlyArray<Row> = [
    ...[2, 3, 4, 4, 5, 6].map((temp) => ({ month: "Jan", temp })),
    ...[18, 19, 20, 21, 22, 30].map((temp) => ({ month: "Jul", temp })),
    ...[10, 11, 12, 12, 13].map((temp) => ({ month: "Apr", temp })),
    { month: "Apr", temp: null },
  ];
  export let order: "none" | "median" = "none";
  export let colorBy: "none" | "series" = "none";
  export let selected: string | null = null;
  export let onselect: (detail: unknown) => void = () => {};
  export let onhover: (detail: unknown) => void = () => {};
</script>

<RidgelineChart
  {data}
  x="temp"
  series="month"
  {order}
  {colorBy}
  title="Temperature by month"
  bind:selected
  data-testid="ridge"
  on:select={(e) => onselect(e.detail)}
  on:hover={(e) => onhover(e.detail)}
/>
<output data-testid="selected">{selected ?? ""}</output>
