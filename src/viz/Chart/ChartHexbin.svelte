<svelte:options immutable />

<script>
  /** @restProps {g} */

  /** Specify the radius of a hexagon, in pixels */
  export let radius = 12;

  /**
   * Specify the sequential hue for the counts.
   * @type {import("../utils/tokens.js").VizSequentialHue}
   */
  export let hue = "blue";

  /**
   * Specify the series to bin. Defaults to every visible series.
   * @type {ReadonlyArray<string | number>}
   */
  export let series = undefined;

  import { getContext } from "svelte";
  import { sequentialColor } from "../utils/color-scale.js";
  import { hexagonPath, hexbin } from "../utils/hexbin.js";
  import { CHART_CONTEXT } from "./context.js";
  import { pickGroups, yScaleOf } from "./model.js";

  /** @type {import("./context.js").ChartContext} */
  const { groups, scales, hover, clip } = getContext(CHART_CONTEXT);

  // Every visible datum as a pixel point, keyed so the hovered point's cell
  // can be found without a search.
  $: points = flatten(pickGroups($groups, series), $scales);
  // Depends on the points and the radius only, so hover never bins again.
  $: cells = hexbin(points, radius);
  // The ramp follows the square root of the count, so a thin region still
  // shows against a dense one.
  $: most = cells.reduce((top, cell) => Math.max(top, cell.count), 0);
  $: cellOf = index(cells, points);
  $: shape = hexagonPath(Math.max(radius - 0.5, 1));
  $: activeCell =
    $hover && $hover.points.length > 0
      ? (cellOf.get(`${$hover.points[0].series}:${$hover.points[0].index}`) ??
        null)
      : null;

  /**
   * @param {ReadonlyArray<import("./model.js").ChartGroup<any>>} list
   * @param {import("./model.js").ChartScales} at
   */
  function flatten(list, at) {
    /** @type {Array<{ x: number; y: number; key: string } | null>} */
    const out = [];
    for (const group of list) {
      if (group.hidden) continue;
      for (let j = 0; j < group.xs.length; j++) {
        const along = at.x.map(group.xs[j]);
        const across = yScaleOf(at, group).map(group.ys[j]);
        out.push(
          Number.isFinite(along) && Number.isFinite(across)
            ? {
                x: at.horizontal ? across : along,
                y: at.horizontal ? along : across,
                key: `${group.key}:${j}`,
              }
            : null,
        );
      }
    }
    return out;
  }

  /**
   * @param {ReadonlyArray<import("../utils/hexbin.js").HexBin>} bins
   * @param {ReadonlyArray<{ key: string } | null>} list
   */
  function index(bins, list) {
    /** @type {Map<string, string>} */
    const out = new Map();
    for (const bin of bins) {
      for (const i of bin.indices) {
        const point = list[i];
        if (point) out.set(point.key, bin.key);
      }
    }
    return out;
  }
</script>

<g clip-path={$clip} class:bx--viz-hexbin={true} {...$$restProps}>
  {#each cells as cell (cell.key)}
    <path
      class:bx--viz-hexbin__cell={true}
      class:bx--viz-hexbin__cell--active={cell.key === activeCell}
      transform="translate({cell.x} {cell.y})"
      d={shape}
      style:--bx-viz-color={sequentialColor(
        most > 0 ? Math.sqrt(cell.count / most) : 0,
        hue,
        { minStep: 2 },
      )}
    >
      <title>{cell.count}</title>
    </path>
  {/each}
</g>
