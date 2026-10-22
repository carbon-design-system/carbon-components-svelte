<script lang="ts">
  import ScatterChart from "carbon-components-svelte/viz/ScatterChart/ScatterChart.svelte";

  type Row = { cpu: number; latency: number; tier: string; cost: number };

  export let data: ReadonlyArray<Row> = [
    { cpu: 10, latency: 100, tier: "a", cost: 5 },
    { cpu: 50, latency: 300, tier: "a", cost: 20 },
    { cpu: 90, latency: 200, tier: "b", cost: 80 },
  ];
  export let size: "cost" | undefined = undefined;
  export let onselect: (detail: unknown) => void = () => {};
  export let onhover: (detail: unknown) => void = () => {};
</script>

<ScatterChart
  {data}
  x="cpu"
  y="latency"
  series="tier"
  {size}
  sizeLabel="Cost"
  title="Latency against CPU"
  xTitle="CPU"
  yTitle="Latency"
  width={640}
  locale="en-US"
  on:select={(e) => onselect(e.detail)}
  on:hover={(e) => onhover(e.detail)}
/>
