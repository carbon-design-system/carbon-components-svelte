<script lang="ts">
  import HorizonChart from "carbon-components-svelte/viz/HorizonChart/HorizonChart.svelte";

  type Row = { t: number; host: string; cpu: number | null };

  export let data: ReadonlyArray<Row> = [
    { t: 0, host: "a", cpu: 10 },
    { t: 1, host: "a", cpu: 50 },
    { t: 2, host: "a", cpu: 90 },
    { t: 0, host: "b", cpu: 20 },
    { t: 1, host: "b", cpu: null },
    { t: 2, host: "b", cpu: 60 },
  ];
  export let syncId: string | undefined = undefined;
  export let onhover: (detail: unknown) => void = () => {};
</script>

<HorizonChart
  {data}
  x="t"
  y="cpu"
  series="host"
  title="CPU by host"
  max={90}
  width={400}
  rowHeight={20}
  locale="en-US"
  {syncId}
  data-testid="horizon"
  on:hover={(e) => onhover(e.detail)}
/>
