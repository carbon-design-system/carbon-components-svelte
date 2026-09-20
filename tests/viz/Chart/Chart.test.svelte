<script lang="ts">
  import Chart from "carbon-components-svelte/viz/Chart/Chart.svelte";
  import ChartProbe from "./ChartProbe.test.svelte";

  type Row = { day: number; region: string; revenue: number | null };

  export let data: ReadonlyArray<Row> = [
    { day: 0, region: "a", revenue: 10 },
    { day: 1, region: "a", revenue: 20 },
    { day: 2, region: "a", revenue: 30 },
    { day: 0, region: "b", revenue: 80 },
    { day: 1, region: "b", revenue: 60 },
    { day: 2, region: "b", revenue: 40 },
  ];
  export let x: "day" | ((row: Row) => string) = "day";
  export let hidden: ReadonlyArray<string | number> = [];
  export let selected: { series: string | number; index: number } | null = null;
  export let title = "Revenue by region";
  export let emitUpdate = false;
  export let includeY: number | undefined = undefined;
  export let withProbe = true;
  export let tickle = 0;
  export let onScales: (scales: unknown) => void = () => {};
  export let onselect: (detail: unknown) => void = () => {};
  export let onhover: (detail: unknown) => void = () => {};
  export let onupdate: (detail: unknown) => void = () => {};
  export let ontoggle: (detail: unknown) => void = () => {};
</script>

<span data-testid="tickle">{tickle}</span>

<Chart
  {data}
  {x}
  y="revenue"
  series="region"
  {title}
  width={640}
  {emitUpdate}
  bind:hidden
  bind:selected
  data-testid="chart"
  on:select={(e) => onselect(e.detail)}
  on:hover={(e) => onhover(e.detail)}
  on:update={(e) => onupdate(e.detail)}
  on:legend:toggle={(e) => ontoggle(e.detail)}
>
  {#if withProbe}
    <ChartProbe {includeY} {onScales} />
  {/if}
</Chart>

<output data-testid="hidden">{hidden.join(",")}</output>
<output data-testid="selected"
  >{selected ? `${selected.series}:${selected.index}` : ""}</output
>
