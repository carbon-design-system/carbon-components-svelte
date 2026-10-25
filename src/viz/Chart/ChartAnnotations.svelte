<svelte:options immutable />

<script>
  /**
   * @restProps {g}
   */

  /**
   * Specify the annotations: a point when `y` is given, else a moment
   * across the plot, each with a short label. `kind` colors the marker.
   * @type {ReadonlyArray<{ x: number | Date | string; y?: number; label: string; kind?: "note" | "info" | "success" | "warning" | "error"; key?: string }>}
   */
  export let items = [];

  import { getContext, onMount } from "svelte";
  import { CHART_CONTEXT } from "./context.js";
  import { labelWidth, placeLabels } from "./label-layout.js";

  const HEIGHT = 16;
  const OFFSET = 8;
  /** Keeps a label off the axes: `$carbon--spacing-03`. */
  const INSET = 8;

  /** @type {import("./context.js").ChartContext} */
  const { scales, clip, includeY } = getContext(CHART_CONTEXT);

  // A point annotation keeps its value inside the y domain while mounted,
  // as a threshold does, so its marker never sits outside the plot.
  /** @type {Array<() => void>} */
  let releases = [];
  $: {
    for (const release of releases) release();
    releases = items
      .filter((item) => item.y !== undefined && Number.isFinite(item.y))
      .map((item) => includeY(/** @type {number} */ (item.y)));
  }
  onMount(() => () => {
    for (const release of releases) release();
  });

  /** @param {number | Date | string} x */
  function alongOf(x) {
    if (typeof x === "string") {
      const index = $scales.categories.indexOf(x);
      return index === -1 ? Number.NaN : $scales.x.map(index);
    }
    return $scales.x.map(x instanceof Date ? x.getTime() : x);
  }

  // Each annotation anchors at its point, or at the top of its moment,
  // and its label takes the first corner around the anchor that is free.
  $: anchors = items.flatMap((item, i) => {
    const along = alongOf(item.x);
    if (!Number.isFinite(along)) return [];
    const { plot } = $scales;
    const point = item.y !== undefined;
    const across = point
      ? $scales.y.map(/** @type {number} */ (item.y))
      : plot.y0;
    const x = $scales.horizontal ? across : along;
    const y = $scales.horizontal ? along : across;
    return [{ key: item.key ?? `${i}`, item, x, y, point }];
  });
  $: placed = new Map(
    placeLabels(
      anchors.map(({ key, item, x, y }) => {
        const width = labelWidth(item.label);
        return {
          key,
          x: x + OFFSET,
          y: y - OFFSET - HEIGHT,
          width,
          height: HEIGHT,
          alternatives: [
            { x: x - OFFSET - width, y: y - OFFSET - HEIGHT },
            { x: x + OFFSET, y: y + OFFSET },
            { x: x - OFFSET - width, y: y + OFFSET },
          ],
        };
      }),
      {
        bounds: {
          x0: $scales.plot.x0 + INSET,
          x1: $scales.plot.x1 - INSET,
          y0: $scales.plot.y0 + INSET,
          y1: $scales.plot.y1 - INSET,
        },
      },
    ).map((box) => [box.key, box]),
  );
</script>

<g clip-path={$clip} class:bx--viz-annotations={true} {...$$restProps}>
  {#each anchors as anchor (anchor.key)}
    {@const box = placed.get(anchor.key)}
    <g
      class:bx--viz-annotations__item={true}
      class:bx--viz-annotations__item--info={anchor.item.kind === "info"}
      class:bx--viz-annotations__item--success={anchor.item.kind === "success"}
      class:bx--viz-annotations__item--warning={anchor.item.kind === "warning"}
      class:bx--viz-annotations__item--error={anchor.item.kind === "error"}
    >
      {#if anchor.point}
        <circle
          class:bx--viz-annotations__marker={true}
          cx={anchor.x}
          cy={anchor.y}
          r="4"
        />
      {:else}
        <line
          class:bx--viz-annotations__line={true}
          x1={$scales.horizontal ? $scales.plot.x0 : anchor.x}
          x2={$scales.horizontal ? $scales.plot.x1 : anchor.x}
          y1={$scales.horizontal ? anchor.y : $scales.plot.y0}
          y2={$scales.horizontal ? anchor.y : $scales.plot.y1}
        />
      {/if}
      {#if box}
        <line
          class:bx--viz-annotations__leader={true}
          x1={anchor.x}
          y1={anchor.y}
          x2={box.x < anchor.x ? box.x + box.width : box.x}
          y2={box.y + box.height / 2}
        />
        <text
          class:bx--viz-annotations__label={true}
          x={box.x}
          y={box.y + box.height - 4}
        >
          {anchor.item.label}
        </text>
      {/if}
    </g>
  {/each}
</g>
