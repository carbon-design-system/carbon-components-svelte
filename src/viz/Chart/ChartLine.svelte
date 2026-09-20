<svelte:options immutable />

<script>
  /** @restProps {g} */

  /**
   * Specify the curve. `"monotone"` is smooth and never overshoots the data.
   * @type {"linear" | "step" | "step-before" | "step-after" | "monotone"}
   */
  export let curve = "linear";

  /** Specify the stroke width in pixels */
  export let strokeWidth = 1.5;

  /**
   * Set to `true` to dash every line, or pass the series keys to dash.
   * Use it for projected or secondary series.
   * @type {boolean | ReadonlyArray<string | number>}
   */
  export let dashed = false;

  /**
   * Specify when to draw a point on each datum.
   * `"all"` falls back to `"hover"` for a series of more than 500 points.
   * @type {"none" | "hover" | "all"}
   */
  export let points = "hover";

  /**
   * Set to `false` to draw every point of a long series.
   * By default a series is downsampled to about two points per pixel,
   * which keeps its shape and bounds the cost by the screen, not the data.
   */
  export let downsample = true;

  /**
   * Restrict the mark to these series keys.
   * @type {ReadonlyArray<string | number>}
   */
  export let series = undefined;

  import { getContext } from "svelte";
  import { CHART_CONTEXT } from "./context.js";
  import { buildLinePath } from "./line-geometry.js";

  const MAX_POINTS = 500;

  /** @type {import("./context.js").ChartContext} */
  const { groups, scales, hover } = getContext(CHART_CONTEXT);

  $: drawn = $groups.filter(
    (group) => !group.hidden && (!series || series.includes(group.key)),
  );
  $: budget = downsample
    ? Math.max(3, Math.round(($scales.plot.x1 - $scales.plot.x0) * 2))
    : undefined;
  // Depends on groups and scales only, so hover never rebuilds a path.
  $: paths = drawn.map((group) => ({
    key: group.key,
    color: group.color,
    dashed:
      dashed === true || (Array.isArray(dashed) && dashed.includes(group.key)),
    d: buildLinePath(group, $scales, { curve, budget }),
  }));
  $: dots =
    points === "all"
      ? drawn
          .filter((group) => group.xs.length <= MAX_POINTS)
          .map((group) => ({
            key: group.key,
            color: group.color,
            at: group.xs
              .map((value, index) => ({
                x: $scales.x.map(value),
                y: $scales.y.map(group.ys[index]),
                ok: Number.isFinite(group.ys[index]),
              }))
              .filter((point) => point.ok),
          }))
      : [];
  $: hovered =
    points !== "none" && $hover
      ? $hover.points.filter(
          (point) => !series || series.includes(point.series),
        )
      : [];
</script>

<g class:bx--viz-line={true} {...$$restProps}>
  {#each paths as path (path.key)}
    <path
      class:bx--viz-line__path={true}
      class:bx--viz-line__path--dashed={path.dashed}
      d={path.d}
      stroke-width={strokeWidth}
      style:--bx-viz-color={path.color}
    />
  {/each}
  {#each dots as group (group.key)}
    {#each group.at as point, i (i)}
      <circle
        class:bx--viz-line__point={true}
        cx={point.x}
        cy={point.y}
        r="2.5"
        style:--bx-viz-color={group.color}
      />
    {/each}
  {/each}
  {#each hovered as point (point.series)}
    <circle
      class:bx--viz-line__point={true}
      class:bx--viz-line__point--hover={true}
      cx={$hover?.px}
      cy={point.py}
      r="4"
      style:--bx-viz-color={point.color}
    />
  {/each}
</g>
