<svelte:options immutable />

<script>
  /** @restProps {g} */

  /**
   * Specify how series share the plot.
   * `"normalized"` expects the chart's `yDomain` to be `[0, 1]`.
   * @type {"none" | "stacked" | "normalized" | "stream"}
   */
  export let stack = "none";

  /**
   * Specify the curve. `"monotone"` is smooth and never overshoots the data.
   * @type {"linear" | "step" | "step-before" | "step-after" | "monotone"}
   */
  export let curve = "linear";

  /**
   * Specify the fill opacity.
   * Defaults to `0.3` for overlapping layers, so every series stays visible,
   * and to `0.8` for stacked ones.
   * @type {number}
   */
  export let opacity = undefined;

  /** Set to `false` to hide the point on the focused datum */
  export let points = true;

  /**
   * Specify the series to draw. Defaults to every series, so set it when
   * marks share a chart, as bars and a line do in a combo.
   * @type {ReadonlyArray<string | number>}
   */
  export let series = undefined;

  import { getContext, onMount } from "svelte";
  import { areaExtent, buildAreas } from "./area-geometry.js";
  import { CHART_CONTEXT } from "./context.js";
  import { pickGroups } from "./model.js";

  /** @type {import("./context.js").ChartContext} */
  const { groups, scales, hover, includeY, clip } = getContext(CHART_CONTEXT);

  /** @type {Array<() => void>} */
  let releases = [];
  /** @type {[number, number] | null} */
  let registered = null;

  // A stack is taller than any one value, so the domain has to know about it.
  // Registering rebuilds the series, which runs this again: only write when
  // the extent itself moved, or it never settles.
  /**
   * @param {typeof $groups} current
   * @param {typeof stack} mode
   */
  function include(current, mode) {
    const next = areaExtent(current, mode);
    if (
      next === registered ||
      (next &&
        registered &&
        next[0] === registered[0] &&
        next[1] === registered[1])
    ) {
      return;
    }
    for (const release of releases) release();
    releases = next ? [includeY(next[0]), includeY(next[1])] : [];
    registered = next;
  }

  $: mine = pickGroups($groups, series);
  $: include(mine, stack);
  // Depends on groups and scales only, so hover never rebuilds a layer.
  $: layers = buildAreas(mine, $scales, { stack, curve });
  $: fill = opacity ?? (stack === "none" ? 0.3 : 0.8);
  $: dots =
    points && $hover
      ? layers
          .map((layer) => ({
            key: layer.key,
            color: layer.color,
            y: layer.tops.get($hover.x),
          }))
          .filter((dot) => dot.y !== undefined)
      : [];

  onMount(() => () => {
    for (const release of releases) release();
  });
</script>

<g clip-path={$clip} class:bx--viz-area={true} {...$$restProps}>
  {#each layers as layer (layer.key)}
    <path
      class:bx--viz-area__fill={true}
      d={layer.area}
      fill-opacity={fill}
      style:--bx-viz-color={layer.color}
    />
  {/each}
  {#each layers as layer (layer.key)}
    <path
      class:bx--viz-area__line={true}
      d={layer.line}
      style:--bx-viz-color={layer.color}
    />
  {/each}
  {#each dots as dot (dot.key)}
    <circle
      class:bx--viz-line__point={true}
      class:bx--viz-line__point--hover={true}
      cx={$hover?.px}
      cy={dot.y}
      r="4"
      style:--bx-viz-color={dot.color}
    />
  {/each}
</g>
