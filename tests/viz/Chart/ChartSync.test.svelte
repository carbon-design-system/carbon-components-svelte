<script lang="ts">
  import Chart from "carbon-components-svelte/viz/Chart/Chart.svelte";
  import ChartBrush from "carbon-components-svelte/viz/Chart/ChartBrush.svelte";
  import ChartRuler from "carbon-components-svelte/viz/Chart/ChartRuler.svelte";
  import ChartTooltip from "carbon-components-svelte/viz/Chart/ChartTooltip.svelte";

  export let syncB: string | undefined = "ops";
  export let onhoverB: (detail: unknown) => void = () => {};
  export let share: ReadonlyArray<"hover" | "zoom" | "brush" | "selection"> = [
    "hover",
  ];
  export let selectedB: { series: string | number; index: number } | null =
    null;
  export let zoomB: [number | Date, number | Date] | null = null;
  export let brushB: [number | Date, number | Date] | null = null;
  export let onbrushA: (detail: unknown) => void = () => {};

  const rows = (scale: number) =>
    [0, 1, 2, 3].map((day) => ({ day, value: (day + 1) * scale }));
</script>

<Chart
  data={rows(10)}
  x="day"
  y="value"
  title="Traffic"
  width={400}
  syncId="ops"
  sync={share}
  on:brush={(e) => onbrushA(e.detail)}
>
  <ChartBrush data-testid="brush-a" />
  <ChartRuler data-testid="ruler-a" />
  <ChartTooltip slot="tooltip" data-testid="tooltip-a" delay={80} />
</Chart>

<Chart
  data={rows(3)}
  x="day"
  y="value"
  title="Errors"
  width={400}
  syncId={syncB}
  sync={share}
  bind:selected={selectedB}
  bind:zoom={zoomB}
  bind:brush={brushB}
  on:hover={(e) => onhoverB(e.detail)}
>
  <ChartRuler data-testid="ruler-b" />
  <ChartTooltip slot="tooltip" data-testid="tooltip-b" delay={80} />
</Chart>

<Chart data={rows(1)} x="day" y="value" title="Unrelated" width={400}>
  <ChartRuler data-testid="ruler-c" />
</Chart>

<output data-testid="selected-b"
  >{selectedB ? `${selectedB.series}:${selectedB.index}` : ""}</output
>
<output data-testid="zoom-b">{zoomB ? zoomB.join(",") : ""}</output>
<output data-testid="brush-b"
  >{brushB ? brushB.map((v) => Math.round(Number(v))).join(",") : ""}</output
>
