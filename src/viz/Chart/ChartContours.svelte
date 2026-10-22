<svelte:options immutable />

<script>
  /** @restProps {g} */

  /** Specify how many contour levels to draw */
  export let levels = 6;

  /** Specify the smoothing bandwidth, in pixels */
  export let bandwidth = 20;

  /** Specify the grid cell size, in pixels. Smaller is smoother and slower. */
  export let cellSize = 4;

  /**
   * Specify the sequential hue for the levels, low to high.
   * @type {import("../utils/tokens.js").VizSequentialHue}
   */
  export let hue = "blue";

  /**
   * Specify the series to measure. Defaults to every visible series.
   * @type {ReadonlyArray<string | number>}
   */
  export let series = undefined;

  import { getContext } from "svelte";
  import { sequentialColor } from "../utils/color-scale.js";
  import { contours, densityGrid, levelsFor } from "../utils/contour.js";
  import { CHART_CONTEXT } from "./context.js";
  import { pickGroups, yScaleOf } from "./model.js";

  /** @type {import("./context.js").ChartContext} */
  const { groups, scales, clip } = getContext(CHART_CONTEXT);

  // Points relative to the plot's corner, so the grid covers the plot only.
  $: points = flatten(pickGroups($groups, series), $scales);
  $: plotWidth = Math.max($scales.plot.x1 - $scales.plot.x0, 1);
  $: plotHeight = Math.max($scales.plot.y1 - $scales.plot.y0, 1);
  // Depends on the points and the options only, so hover never re-runs it.
  $: grid = densityGrid(points, {
    width: plotWidth,
    height: plotHeight,
    cellSize,
    bandwidth,
  });
  $: lines = contours(
    grid,
    levelsFor(grid.peak, Math.max(1, Math.floor(levels))),
  );

  /**
   * @param {ReadonlyArray<import("./model.js").ChartGroup<any>>} list
   * @param {import("./model.js").ChartScales} at
   */
  function flatten(list, at) {
    /** @type {Array<{ x: number; y: number }>} */
    const out = [];
    for (const group of list) {
      if (group.hidden) continue;
      for (let j = 0; j < group.xs.length; j++) {
        const along = at.x.map(group.xs[j]);
        const across = yScaleOf(at, group).map(group.ys[j]);
        if (!Number.isFinite(along) || !Number.isFinite(across)) continue;
        out.push({
          x: (at.horizontal ? across : along) - at.plot.x0,
          y: (at.horizontal ? along : across) - at.plot.y0,
        });
      }
    }
    return out;
  }
</script>

<g
  clip-path={$clip}
  class:bx--viz-contours={true}
  transform="translate({$scales.plot.x0} {$scales.plot.y0})"
  {...$$restProps}
>
  {#each lines as line, i (line.level)}
    {#if line.d}
      <path
        class:bx--viz-contours__line={true}
        d={line.d}
        style:--bx-viz-color={sequentialColor(
          lines.length > 1 ? i / (lines.length - 1) : 1,
          hue,
          { minStep: 4 },
        )}
      />
    {/if}
  {/each}
</g>
