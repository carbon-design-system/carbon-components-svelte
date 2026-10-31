<script lang="ts">
  import Chart from "carbon-components-svelte/viz/Chart/Chart.svelte";
  import ChartBars from "carbon-components-svelte/viz/Chart/ChartBars.svelte";
  import ChartCrosshair from "carbon-components-svelte/viz/Chart/ChartCrosshair.svelte";
  import ChartLegend from "carbon-components-svelte/viz/Chart/ChartLegend.svelte";
  import ChartLine from "carbon-components-svelte/viz/Chart/ChartLine.svelte";
  import ChartPoints from "carbon-components-svelte/viz/Chart/ChartPoints.svelte";
  import ChartRuler from "carbon-components-svelte/viz/Chart/ChartRuler.svelte";
  import ChartThreshold from "carbon-components-svelte/viz/Chart/ChartThreshold.svelte";
  import ChartTooltip from "carbon-components-svelte/viz/Chart/ChartTooltip.svelte";
  import ChartTooltipRow from "carbon-components-svelte/viz/Chart/ChartTooltipRow.svelte";

  export let data = [
    { day: 0, region: "a", revenue: 10 },
    { day: 1, region: "a", revenue: 20 },
    { day: 2, region: "a", revenue: 30 },
    { day: 0, region: "b", revenue: 80 },
    { day: 1, region: "b", revenue: 60 },
    { day: 2, region: "b", revenue: 40 },
    { day: 0, region: "c", revenue: 5 },
    { day: 1, region: "c", revenue: 6 },
    { day: 2, region: "c", revenue: 7 },
  ];
  export let hidden: ReadonlyArray<string | number> = [];
  export let threshold: number | undefined = undefined;
  export let thresholdTo: number | undefined = undefined;
  export let thresholdKind: "error" | "warning" = "error";
  export let customTooltip = false;
  export let delay = 150;
  export let crosshair = false;
  export let shapes = false;
  export let compare: { period: number; label?: string } | null = null;
  export let sort: "series" | "stack" | "value" | "value-asc" = "series";
  export let maxRows = Number.POSITIVE_INFINITY;
  export let ontoggle: (detail: unknown) => void = () => {};
</script>

<Chart
  {data}
  x="day"
  y="revenue"
  series="region"
  title="Revenue"
  width={640}
  bind:hidden
  {compare}
  on:legend:toggle={(e) => ontoggle(e.detail)}
>
  {#if threshold !== undefined}
    <ChartThreshold
      y={threshold}
      to={thresholdTo}
      label="Target"
      kind={thresholdKind}
      data-testid="threshold"
    />
  {/if}
  <ChartLine data-testid="line" />
  {#if shapes}
    <ChartBars pattern="auto" />
    <ChartPoints symbol="auto" />
  {/if}
  <ChartRuler data-testid="ruler" />
  {#if crosshair}
    <ChartCrosshair data-testid="crosshair" />
  {/if}
  <svelte:fragment slot="tooltip">
    {#if customTooltip}
      <ChartTooltip
        data-testid="tooltip"
        {delay}
        {sort}
        {maxRows}
        let:points
        let:xLabel
        let:hidden
      >
        <strong>Day {xLabel}</strong>
        {#each points as point (point.series)}
          <ChartTooltipRow
            label={`Region ${point.series}`}
            value={`$${point.value}`}
            color={point.color}
          />
        {/each}
        {#if hidden > 0}
          <em data-testid="folded">{hidden}</em>
        {/if}
      </ChartTooltip>
    {:else}
      <ChartTooltip data-testid="tooltip" {delay} {sort} {maxRows} />
    {/if}
  </svelte:fragment>
  <ChartLegend slot="legend" data-testid="legend" />
</Chart>

<output data-testid="hidden">{hidden.join(",")}</output>
