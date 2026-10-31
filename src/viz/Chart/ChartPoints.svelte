<svelte:options immutable />

<script>
  /** @restProps {g} */

  /** Specify the radius, in pixels, when there is no `size` */
  export let radius = 4;

  /**
   * Specify how to read a size from a row, for a bubble chart: a key or a
   * function. The circle's area follows the value.
   * @type {string | ((row: any, index: number) => number | null | undefined)}
   */
  export let size = undefined;

  /**
   * Specify the smallest and largest radius, in pixels, when `size` is set.
   * @type {readonly [number, number]}
   */
  export let sizeRange = [4, 24];

  /**
   * Specify the series to draw. Defaults to every series, so set it when
   * marks share a chart, as bars and a line do in a combo.
   * @type {ReadonlyArray<string | number>}
   */
  export let series = undefined;

  /**
   * Set to `true` to draw nothing while still answering hover and the
   * keyboard, as under a density layer that stands in for the points.
   */
  export let hidden = false;

  /**
   * Specify how the points are drawn: as SVG elements, or as pixels on the
   * chart's canvas for tens of thousands of points. Hover, the keyboard,
   * and the tooltip work the same either way; only the hovered point is
   * an element when painting.
   * @type {"svg" | "canvas"}
   */
  export let renderer = "svg";

  /**
   * Specify whether to label the points: `"auto"` keeps the labels that
   * do not collide, `"all"` draws every one.
   * @type {"none" | "auto" | "all"}
   */
  export let labels = "none";

  /**
   * Specify how to read a point's label from its row. Defaults to the
   * formatted y value.
   * @type {import("../utils/accessor.js").Accessor<any, string | number> | undefined}
   */
  export let label = undefined;

  /**
   * Specify a symbol per series, so series tell apart without color:
   * `"auto"` cycles circle, square, triangle, diamond, cross, star in
   * series order, or a map names one per series.
   * @type {"auto" | Partial<Record<string, import("./shapes.js").Symbol>> | undefined}
   */
  export let symbol = undefined;

  import { getContext, onMount } from "svelte";
  import { toAccessor } from "../utils/accessor.js";
  import { CHART_CONTEXT } from "./context.js";
  import { labelWidth, placeLabels } from "./label-layout.js";
  import { pickGroups } from "./model.js";
  import { buildPoints, paintPoints } from "./point-geometry.js";
  import { assignShapes, SYMBOLS, symbolPath } from "./shapes.js";

  const LABEL_HEIGHT = 14;
  const LABEL_GAP = 3;
  const MAX_LABELS = 300;

  /** @type {import("./context.js").ChartContext} */
  const {
    groups,
    scales,
    hover,
    usePointHover,
    clip,
    canvas,
    selectedKeys,
    emphasis,
    setShapes,
  } = getContext(CHART_CONTEXT);

  /** @type {(() => void) | null} */
  let unregister = null;
  /** The circles the painter draws, read at paint time. */
  let painted = /** @type {import("./point-geometry.js").PointCircle[]} */ ([]);

  // Register with the canvas while painting, and let go when not.
  $: usePainter(renderer === "canvas" && !hidden);
  $: painted = circles;
  $: if (renderer === "canvas") canvas.invalidate(circles);

  /** @param {boolean} on */
  function usePainter(on) {
    if (on && !unregister) {
      unregister = canvas.register({
        dimOnHover: true,
        draw: (context, paint) => paintPoints(context, painted, paint.resolve),
      });
    } else if (!on && unregister) {
      unregister();
      unregister = null;
    }
  }

  // Points rarely share an x, so hover follows the nearest point instead.
  const release = usePointHover();
  onMount(() => () => {
    release();
    unregister?.();
  });

  $: sizeOf = size === undefined ? undefined : toAccessor(size);
  // Depends on groups and scales only, so hover never rebuilds a circle.
  $: circles = buildPoints(mine, $scales, {
    radius,
    size: sizeOf,
    sizeRange,
  });
  $: labelOf = label === undefined ? undefined : toAccessor(label);
  $: symbols = assignShapes(
    $groups.map((group) => group.key),
    symbol,
    SYMBOLS,
  );
  $: setShapes(symbols, "symbol");
  $: mine = pickGroups($groups, series);
  // A label beside its point, to the right first, then left, then above.
  $: labelBoxes =
    labels === "none" || circles.length > MAX_LABELS
      ? []
      : (() => {
          const rowsOf = new Map(mine.map((group) => [group.key, group]));
          const boxes = circles.map((circle) => {
            const group = rowsOf.get(circle.series);
            const row = group?.rows[circle.index];
            const text =
              labelOf && row !== undefined
                ? String(labelOf(row, circle.index))
                : $scales.yFormat(group?.ys[circle.index] ?? Number.NaN);
            const width = labelWidth(text);
            return {
              key: circle.key,
              text,
              x: circle.cx + circle.r + LABEL_GAP,
              y: circle.cy - LABEL_HEIGHT / 2,
              width,
              height: LABEL_HEIGHT,
              alternatives: [
                {
                  x: circle.cx - circle.r - LABEL_GAP - width,
                  y: circle.cy - LABEL_HEIGHT / 2,
                },
                {
                  x: circle.cx - width / 2,
                  y: circle.cy - circle.r - LABEL_GAP - LABEL_HEIGHT,
                },
                {
                  x: circle.cx - width / 2,
                  y: circle.cy + circle.r + LABEL_GAP,
                },
              ],
            };
          });
          if (labels === "all")
            return boxes.map((box) => ({ ...box, moved: false }));
          const byKey = new Map(boxes.map((box) => [box.key, box]));
          return placeLabels(boxes, { bounds: $scales.plot }).map((box) => ({
            ...box,
            text: byKey.get(box.key)?.text ?? "",
          }));
        })();
  // The hovered point's key, as the circles are keyed: by what identifies
  // the row, not its index.
  $: active = (() => {
    const point = $hover?.points[0];
    if (!point) return null;
    const group = $groups.find((candidate) => candidate.key === point.series);
    return `${point.series}:${group?.keys[point.index] ?? point.index}`;
  })();
</script>

<g
  clip-path={$clip}
  class:bx--viz-points={true}
  class:bx--viz-points--sized={size !== undefined}
  {...$$restProps}
>
  {#each circles as circle (circle.key)}
    {#if (!hidden && renderer !== "canvas") || circle.key === active}
      {@const shape = symbols.get(circle.series) ?? "circle"}
      {#if shape === "circle"}
        <circle
          class:bx--viz-points__point={true}
          class:bx--viz-points__point--active={circle.key === active}
          class:bx--viz-points__point--selected={$selectedKeys.has(circle.key)}
          class:bx--viz-points__point--dimmed={!hidden &&
            renderer !== "canvas" &&
            ((active !== null && circle.key !== active) ||
              ($emphasis !== null && $emphasis !== circle.series))}
          cx={circle.cx}
          cy={circle.cy}
          r={circle.r}
          style:--bx-viz-color={circle.color}
        />
      {:else}
        <path
          class:bx--viz-points__point={true}
          class:bx--viz-points__point--active={circle.key === active}
          class:bx--viz-points__point--selected={$selectedKeys.has(circle.key)}
          class:bx--viz-points__point--dimmed={!hidden &&
            renderer !== "canvas" &&
            ((active !== null && circle.key !== active) ||
              ($emphasis !== null && $emphasis !== circle.series))}
          d={symbolPath(shape, circle.r)}
          transform="translate({circle.cx} {circle.cy})"
          style:--bx-viz-color={circle.color}
        />
      {/if}
    {/if}
  {/each}
  {#each labelBoxes as box (box.key)}
    <text
      class:bx--viz-labels__label={true}
      x={box.x}
      y={box.y + box.height - 3}
    >
      {box.text}
    </text>
  {/each}
</g>
