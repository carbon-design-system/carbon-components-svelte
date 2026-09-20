<svelte:options immutable />

<script lang="ts">
  import type { ChartContext } from "carbon-components-svelte/viz/Chart/context.js";
  import { CHART_CONTEXT } from "carbon-components-svelte/viz/Chart/context.js";

  type Row = { day: number; region: string; revenue: number | null };

  import { getContext, onDestroy } from "svelte";

  /** Ask the chart to keep this y value in its domain. */
  export let includeY: number | undefined = undefined;
  /** Called on every scales emission, to count recomputes. */
  export let onScales: (scales: unknown) => void = () => {};

  const {
    groups,
    scales,
    hover,
    hidden,
    includeY: include,
    toggleSeries,
  } = getContext<ChartContext<Row>>(CHART_CONTEXT);

  const release = includeY === undefined ? () => {} : include(includeY);
  // Subscribe directly: counts store emissions, not this component's renders.
  const unsubscribe = scales.subscribe((value: unknown) => onScales(value));
  onDestroy(() => {
    release();
    unsubscribe();
  });
</script>

<!-- A throwaway mark: exposes what the context holds as data attributes. -->
<g
  data-testid="probe"
  data-series={$groups.map((group) => group.key).join(",")}
  data-visible={$groups
    .filter((group) => !group.hidden)
    .map((group) => group.key)
    .join(",")}
  data-hidden={$hidden.join(",")}
  data-y-ticks={$scales.yTicks.join(",")}
  data-x-ticks={$scales.xTicks.map($scales.xFormat).join(",")}
  data-hover-x={$hover ? $hover.x : ""}
  data-hover-series={$hover ? $hover.points.map((p) => p.series).join(",") : ""}
>
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <circle
    data-testid="toggle-b"
    r="4"
    on:click|stopPropagation={() => toggleSeries("b")}
  />
</g>
