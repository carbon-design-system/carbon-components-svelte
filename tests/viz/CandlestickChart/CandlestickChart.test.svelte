<script lang="ts">
  import CandlestickChart from "carbon-components-svelte/viz/CandlestickChart/CandlestickChart.svelte";

  type Row = { day: string; o: number; h: number; l: number; c: number | null };

  export let data: ReadonlyArray<Row> = [
    { day: "Mon", o: 100, h: 108, l: 97, c: 106 },
    { day: "Tue", o: 106, h: 110, l: 99, c: 101 },
    { day: "Wed", o: 101, h: 103, l: 95, c: 101 },
    { day: "Thu", o: 101, h: 112, l: 100, c: 111 },
    { day: "Fri", o: 111, h: 115, l: 104, c: null },
  ];
  export let hollow = true;
  export let view: "chart" | "table" = "chart";
</script>

<CandlestickChart
  {data}
  x="day"
  open="o"
  high="h"
  low="l"
  close="c"
  {hollow}
  title="ACME, this week"
  width={640}
  locale="en-US"
  bind:view
/>
